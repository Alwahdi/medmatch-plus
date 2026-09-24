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
export type GoogleSignInResult = { error?: Error; redirected?: boolean };

function isLovableHost(hostname: string): boolean {
  return (
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
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
      redirectTo: redirectUrl,
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
