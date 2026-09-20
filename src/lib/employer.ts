import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import type { Lang } from "@/lib/i18n";

/**
 * جهات العمل التي تعامل معها المستخدم سابقاً ولم يعد لها حساب قائم على المنصة.
 * الدالة في قاعدة البيانات محصورة بسجلات المستخدم نفسه ولا تكشف أي بيانات عن الجهة.
 */
export function useInactiveEmployers() {
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: ["inactive-employers", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_inactive_employers");
      if (error) throw error;
      return new Set<string>((data ?? []) as unknown as string[]);
    },
  });
  return data ?? new Set<string>();
}

const EMPLOYER_TXT = {
  ar: {
    unavailable: "جهة العمل غير متاحة",
    unavailableNote:
      "لم تعد جهة العمل نشطة على المنصة، وهذه الفرصة لم تعد معروضة. السجل محفوظ لك للاطلاع فقط، ولا تتوفر مراسلة أو تقييم أو مقابلة.",
  },
  en: {
    unavailable: "Employer unavailable",
    unavailableNote:
      "This employer is no longer active on the platform and the listing is no longer available. The record is kept for your reference only — messaging, reviews, and interviews aren't available.",
  },
} as const;

export function employerText(lang: Lang) {
  return EMPLOYER_TXT[lang === "en" ? "en" : "ar"];
}
