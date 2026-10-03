import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

// New backend objects are not yet in the generated mobile types.
const db = supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<unknown>; from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<unknown> } } };

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function registerDevice() {
  if (!Device.isDevice) return;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", { name: "SyndeoCare", importance: Notifications.AndroidImportance.HIGH });
  }
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted" && current.canAskAgain) status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await db.rpc("register_mobile_push_token", { _token: token, _platform: Platform.OS === "ios" ? "ios" : "android" });
}

/** Registers the signed-in device for push and opens the notification's screen on tap. */
export function PushRegistrar() {
  const { user } = useAuth();
  const router = useRouter();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user || registeredFor.current === user.id) return;
    registeredFor.current = user.id;
    registerDevice().catch(() => { registeredFor.current = null; });
  }, [user]);

  useEffect(() => {
    // Notification links are web paths; the in-app notifications screen already maps them to app screens.
    const open = () => router.push("/notifications");
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) open(); }).catch(() => {});
    return () => sub.remove();
  }, [router]);

  return null;
}

/** Stops pushes to this device before signing out. */
export async function unregisterDevice() {
  try {
    if (!Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await db.from("mobile_push_tokens").delete().eq("token", token);
  } catch {
    // best effort
  }
}
