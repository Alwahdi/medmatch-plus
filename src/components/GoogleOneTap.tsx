import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getGoogleOneTapClientId } from "@/lib/google-one-tap.functions";

const GIS_SRC = "https://accounts.google.com/gsi/client";

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
      const clientId = await getGoogleOneTapClientId().catch(() => null);
      if (!clientId || cancelled) return;
      await loadGis().catch(() => undefined);
      if (cancelled || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          if (!response.credential) return;
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });
          if (error) {
            toast.error(errorText);
            return;
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
