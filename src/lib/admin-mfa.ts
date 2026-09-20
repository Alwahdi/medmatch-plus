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
