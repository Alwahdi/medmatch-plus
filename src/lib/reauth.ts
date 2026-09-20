import { createClient } from "@supabase/supabase-js";

/**
 * التحقق من كلمة المرور الحالية دون المساس بجلسة المستخدم الحالية.
 * يُستخدم عميل مؤقت لا يحفظ الجلسة ولا يحدّثها ولا يقرأ الرابط،
 * فلا يمكن أن يستبدل جلسة aal2 بجلسة aal1.
 * لا تُخزَّن كلمة المرور ولا أي رمز وصول.
 */
export async function verifyCurrentPassword(email: string, password: string, userId: string) {
  const url = import.meta.env['VITE_SUPABASE_URL'];
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) return false;

  const ephemeral = createClient(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    const { data, error } = await ephemeral.auth.signInWithPassword({ email, password });
    if (error || !data.user || data.user.id !== userId) return false;
    return true;
  } catch {
    return false;
  } finally {
    // إنهاء الجلسة المؤقتة محلياً فقط — لا تأثير على جلسات المستخدم الأخرى.
    try {
      await ephemeral.auth.signOut({ scope: "local" });
    } catch {
      /* لا شيء */
    }
  }
}
