import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import type { Database } from "./database.types";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const SUPABASE_URL = extra["supabaseUrl"] ?? "";
export const SUPABASE_KEY = extra["supabasePublishableKey"] ?? "";
export const WEB_URL = extra["webUrl"] ?? "";

/**
 * SecureStore has a ~2KB per-value limit, so the session is split into chunks.
 * A small index entry in AsyncStorage tracks how many chunks a key uses.
 */
const CHUNK = 1800;

const secureAdapter = {
  async getItem(key: string) {
    const countRaw = await AsyncStorage.getItem(`${key}::chunks`);
    if (!countRaw) return null;
    const count = Number(countRaw);
    let out = "";
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}_${i}`);
      if (part == null) return null;
      out += part;
    }
    return out;
  },
  async setItem(key: string, value: string) {
    await secureAdapter.removeItem(key);
    const count = Math.ceil(value.length / CHUNK) || 1;
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await AsyncStorage.setItem(`${key}::chunks`, String(count));
  },
  async removeItem(key: string) {
    const countRaw = await AsyncStorage.getItem(`${key}::chunks`);
    const count = countRaw ? Number(countRaw) : 0;
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(`${key}_${i}`);
    }
    await AsyncStorage.removeItem(`${key}::chunks`);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: Platform.OS === "web" ? undefined : secureAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
