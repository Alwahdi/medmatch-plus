import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

/**
 * هوية جهة العمل تُقرأ من قاعدة البيانات فقط عند وجود تعامل حقيقي ومالك حساب حي.
 * إن لم يُرجع الاستعلام صفاً، فجهة العمل غير متاحة (حساب غير قائم أو هوية غير مكشوفة).
 */
export function useEmployerIdentities(facilityIds: (string | null | undefined)[]) {
  const ids = Array.from(new Set(facilityIds.filter(Boolean) as string[])).sort();
  return useQuery({
    queryKey: ["employer-identities", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("facilities").select("id,name_ar").in("id", ids);
      if (error) throw error;
      const map = new Map<string, string>();
      for (const f of data ?? []) map.set(f.id, f.name_ar);
      return map;
    },
  });
}

export const EMPLOYER_TXT = {
  ar: {
    unavailable: "جهة العمل غير متاحة",
    unavailableNote: "لم تعد جهة العمل نشطة على المنصة. هذا السجل محفوظ للاطلاع فقط، ولا تتوفر مراسلة أو تقييم أو مقابلة.",
    closedListing: "هذه الفرصة لم تعد معروضة.",
  },
  en: {
    unavailable: "Employer unavailable",
    unavailableNote:
      "This employer is no longer active on the platform. The record is kept for your reference only — messaging, reviews, and interviews aren't available.",
    closedListing: "This listing is no longer available.",
  },
} as const;

export function employerText(lang: Lang) {
  return EMPLOYER_TXT[lang === "en" ? "en" : "ar"];
}
