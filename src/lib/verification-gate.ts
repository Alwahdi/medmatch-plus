import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireProfessionalVerification } from "@/lib/platform-settings";

/**
 * هل يُمنع هذا المستخدم من التقديم/الحجز لأنه كادر غير موثّق؟
 * القرار النهائي في قاعدة البيانات؛ هذه البوابة لتوضيح السبب قبل المحاولة.
 */
export function useProfessionalVerificationGate(userId: string | undefined) {
  const required = useRequireProfessionalVerification();
  const { data, isLoading } = useQuery({
    queryKey: ["my-pro-verified", userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("healthcare_professionals")
        .select("id,is_verified")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const verified = !!data?.is_verified;
  return {
    /** يُمنع التقديم حالياً */
    blocked: !!userId && required && !isLoading && !verified,
    hasProfile: !!data,
    verified,
    required,
  };
}
