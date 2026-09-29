import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

/**
 * تسجيل الدخول/الإنشاء عبر جوجل.
 *
 * على نطاقات Lovable (lovable.app / المعاينة) نستخدم وسيط Lovable OAuth
 * لأنه مضبوط مسبقاً. على النطاقات المخصصة المستضافة خارج Lovable
 * (مثل syndeocare.ai على Vercel) مسار الوسيط ‎/~oauth غير موجود،
 * لذلك نستخدم OAuth الأصلي للخلفية مباشرة (يتطلب تفعيل مزوّد جوجل
 * وإضافة النطاق لقائمة عناوين الرجوع المسموحة).
 */
export type GoogleSignInResult = { error?: Error | null | undefined; redirected?: boolean | undefined };

function isLovableHost(hostname: string): boolean {
  return (
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

const NEXT_KEY = "sc_oauth_next";

function stripQuery(redirectUrl: string): string {
  const url = new URL(redirectUrl, window.location.origin);
  const next = url.searchParams.get("next");
  try {
    if (next && next.startsWith("/") && !next.startsWith("//")) sessionStorage.setItem(NEXT_KEY, next);
    else sessionStorage.removeItem(NEXT_KEY);
  } catch {
    /* storage unavailable */
  }
  return `${url.origin}${url.pathname}`;
}

/** يقرأ الوجهة الداخلية المحفوظة قبل الانتقال إلى جوجل ثم يحذفها. */
export function consumeOAuthNext(): string | undefined {
  try {
    const v = sessionStorage.getItem(NEXT_KEY);
    if (v) sessionStorage.removeItem(NEXT_KEY);
    return v ?? undefined;
  } catch {
    return undefined;
  }
}

export async function signInWithGoogle(redirectUrl: string): Promise<GoogleSignInResult> {
  if (isLovableHost(window.location.hostname)) {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUrl,
    });
    return result;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // عنوان الرجوع بلا معاملات استعلام حتى يطابق قائمة العناوين المسموحة حرفياً؛
      // وإلا تعيد الخلفية المستخدم إلى العنوان الافتراضي (نطاق Lovable).
      redirectTo: stripQuery(redirectUrl),
      skipBrowserRedirect: false,
    },
  });
  if (error) return { error };
  // مع التحويل التلقائي لن نصل هنا غالباً، لكن ندعم الحالة اليدوية.
  if (data?.url) {
    window.location.href = data.url;
    return { redirected: true };
  }
  return {};
}
