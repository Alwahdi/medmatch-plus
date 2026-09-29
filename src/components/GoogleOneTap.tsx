import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getGoogleOneTapClientId } from "@/lib/google-one-tap.functions";

const GIS_SRC = "https://accounts.google.com/gsi/client";
// Google OAuth client IDs are public identifiers. This fallback keeps GIS
// available on the separately hosted Vercel deployment where server secrets
// are not automatically synchronized from Lovable Cloud.
const GOOGLE_WEB_CLIENT_ID =
  "691658345848-3a7klfvmijdn9gjlebs24jkdf4o278gt.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type: "standard";
              theme: "outline";
              size: "large";
              text: "continue_with";
              shape: "rectangular";
              width: number;
              locale?: string;
            },
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("gis load failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gis load failed"));
    document.head.appendChild(script);
  });
}

async function getClientId(): Promise<string> {
  return (await getGoogleOneTapClientId().catch(() => null)) ?? GOOGLE_WEB_CLIENT_ID;
}

async function acceptCredential(credential: string | undefined): Promise<boolean> {
  if (!credential) return false;
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });
  return !error;
}

/** Vercel does not host Lovable's /~oauth broker, so GIS completes in place. */
export function usesDirectGoogleIdentity(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return !(
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

/**
 * نافذة «تسجيل الدخول بنقرة واحدة» من جوجل.
 * تظهر فقط للزائر غير المسجّل، وعند اختيار الحساب نستبدل رمز جوجل
 * بجلسة المنصة مباشرة دون مغادرة الصفحة. أي فشل يمر بصمت —
 * زر جوجل العادي يبقى متاحاً دائماً.
 */
export function GoogleOneTap({
  enabled,
  errorText,
}: {
  enabled: boolean;
  errorText: string;
}) {
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      const clientId = await getClientId();
      if (cancelled) return;
      await loadGis().catch(() => undefined);
      if (cancelled || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          const accepted = await acceptCredential(response.credential);
          if (!accepted) {
            toast.error(errorText);
          }
          // نجاح: useSession في الصفحة يلتقط الجلسة ويوجّه المستخدم.
        },
      });
      window.google.accounts.id.prompt();
    })();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [enabled, errorText]);

  return null;
}

/**
 * Official Google button for custom-hosted deployments. It receives an ID
 * token and creates the app session without leaving syndeocare.ai.
 */
export function GoogleIdentityButton({
  errorText,
  lang,
  onBeforeSignIn,
}: {
  errorText: string;
  lang: "ar" | "en";
  onBeforeSignIn?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current || !usesDirectGoogleIdentity()) return;
    let cancelled = false;

    void (async () => {
      const clientId = await getClientId();
      await loadGis().catch(() => undefined);
      const googleId = window.google?.accounts?.id;
      const host = hostRef.current;
      if (cancelled || !googleId || !host) return;

      googleId.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          onBeforeSignIn?.();
          const accepted = await acceptCredential(response.credential);
          if (!accepted) toast.error(errorText);
        },
      });
      host.replaceChildren();
      googleId.renderButton(host, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.min(360, Math.max(240, host.clientWidth)),
        locale: lang,
      });
      rendered.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [errorText, lang, onBeforeSignIn]);

  return <div ref={hostRef} className="flex min-h-11 w-full items-center justify-center overflow-hidden" />;
}
