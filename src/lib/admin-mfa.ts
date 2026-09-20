import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * حسابات الإدارة ملزمة بالتحقق بخطوتين: الخادم يرفض أي عملية إدارية بدون
 * عامل TOTP موثّق وجلسة aal2. هذا الخطّاف للواجهة فقط — الحماية الفعلية في
 * قاعدة البيانات عبر require_admin_mfa()/admin_mfa_access_ok().
 */
export function useVerifiedTotp(enabled = true) {
  return useQuery({
    queryKey: ["mfa-verified-totp"],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return !!data?.totp?.some((f) => f.status === "verified");
    },
  });
}

/**
 * لا يكفي وجود عامل TOTP: الخادم يشترط جلسة aal2. حساب سجّل الدخول بكلمة المرور
 * فقط يبقى aal1 فتفشل كل عمليات المراجعة، لذا نكشف الحالة للواجهة.
 */
export function useSessionAal2(enabled = true) {
  return useQuery({
    queryKey: ["mfa-session-aal2"],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      return data?.currentLevel === "aal2";
    },
  });
}
