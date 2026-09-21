import * as WebBrowser from "expo-web-browser";
import { supabase, WEB_URL } from "./supabase";

/**
 * Deep link the app listens on after the provider redirect.
 * The web bridge page (/mobile-auth) forwards the provider response here,
 * so the redirect target stays on the allow-listed site origin.
 */
export const AUTH_CALLBACK = "syndeocare://auth-callback";
const WEB_ORIGIN = WEB_URL.replace(/\/$/, "");
const BRIDGE_URL = `${WEB_ORIGIN}/mobile-auth`;
const BROKER_URL = `${WEB_ORIGIN}/~oauth/initiate`;

export type OAuthOutcome = { ok: true } | { ok: false; cancelled: boolean; error?: unknown };

function paramsFrom(url: string): URLSearchParams {
  const [, rest = ""] = url.split("?");
  const [query = "", hash = ""] = rest.split("#");
  return new URLSearchParams([query, hash].filter(Boolean).join("&"));
}

function generateState(): string {
  const bytes = new Uint8Array(16);
  const globalCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (globalCrypto?.getRandomValues) {
    globalCrypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Google sign-in goes through the Lovable OAuth broker (same as the web app):
 * the provider is not configured directly on the backend, so calling
 * supabase.auth.signInWithOAuth from the app fails with "missing OAuth secret".
 *
 * Flow: broker -> Google -> broker -> /mobile-auth (published origin, allow-listed)
 * -> syndeocare://auth-callback with the session tokens -> setSession.
 */
export async function signInWithGoogle(intendedRole?: "professional" | "facility"): Promise<OAuthOutcome> {
  try {
    const state = generateState();
    const brokerParams = new URLSearchParams({
      provider: "google",
      redirect_uri: BRIDGE_URL,
      state,
      prompt: "select_account",
    });
    const startUrl = `${BROKER_URL}?${brokerParams.toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(startUrl, AUTH_CALLBACK, {
      preferEphemeralSession: false,
    });
    if (result.type !== "success") return { ok: false, cancelled: true };

    const params = paramsFrom(result.url);
    const providerError = params.get("error_description") ?? params.get("error");
    if (providerError) return { ok: false, cancelled: false, error: new Error(providerError) };

    const returnedState = params.get("state");
    if (!returnedState || returnedState !== state) {
      return { ok: false, cancelled: false, error: new Error("invalid_state") };
    }

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) return { ok: false, cancelled: false, error: sessionError };
      if (intendedRole) {
        const { error: roleError } = await supabase.auth.updateUser({ data: { intended_role: intendedRole } });
        if (roleError) return { ok: false, cancelled: false, error: roleError };
      }
      return { ok: true };
    }

    const code = params.get("code");
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) return { ok: false, cancelled: false, error: exchangeError };
      if (intendedRole) {
        const { error: roleError } = await supabase.auth.updateUser({ data: { intended_role: intendedRole } });
        if (roleError) return { ok: false, cancelled: false, error: roleError };
      }
      return { ok: true };
    }

    return { ok: false, cancelled: false, error: new Error("missing_auth_response") };
  } catch (error) {
    return { ok: false, cancelled: false, error };
  } finally {
    WebBrowser.maybeCompleteAuthSession();
  }
}
