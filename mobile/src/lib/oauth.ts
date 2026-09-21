import * as WebBrowser from "expo-web-browser";
import { supabase, WEB_URL } from "./supabase";

/**
 * Deep link the app listens on after the provider redirect.
 * The web bridge page (/mobile-auth) forwards the provider response here,
 * so the redirect target stays on the allow-listed site origin.
 */
export const AUTH_CALLBACK = "syndeocare://auth-callback";
const BRIDGE_URL = `${WEB_URL.replace(/\/$/, "")}/mobile-auth`;

export type OAuthOutcome = { ok: true } | { ok: false; cancelled: boolean; error?: unknown };

function paramsFrom(url: string): URLSearchParams {
  const [, rest = ""] = url.split("?");
  const [query = "", hash = ""] = rest.split("#");
  return new URLSearchParams([query, hash].filter(Boolean).join("&"));
}

export async function signInWithGoogle(): Promise<OAuthOutcome> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: BRIDGE_URL,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error || !data?.url) return { ok: false, cancelled: false, ...(error ? { error } : {}) };

    const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_CALLBACK, {
      preferEphemeralSession: false,
    });
    if (result.type !== "success") return { ok: false, cancelled: true };

    const params = paramsFrom(result.url);
    const providerError = params.get("error_description") ?? params.get("error");
    if (providerError) return { ok: false, cancelled: false, error: new Error(providerError) };

    const code = params.get("code");
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) return { ok: false, cancelled: false, error: exchangeError };
      return { ok: true };
    }

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) return { ok: false, cancelled: false, error: sessionError };
      return { ok: true };
    }

    return { ok: false, cancelled: false, error: new Error("missing_auth_response") };
  } catch (error) {
    return { ok: false, cancelled: false, error };
  } finally {
    WebBrowser.maybeCompleteAuthSession();
  }
}
