import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlatformSettingKey =
  | "require_facility_verification"
  | "require_professional_verification";

/** إعدادات المنصة القابلة للتحكم من لوحة الإدارة (الافتراضي: مفعّلة). */
export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, enabled, updated_at, updated_by");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function settingEnabled(
  rows: { key: string; enabled: boolean }[] | undefined,
  key: PlatformSettingKey,
): boolean {
  const row = rows?.find((r) => r.key === key);
  return row ? row.enabled : true;
}

/** هل يشترط توثيق المنشأة قبل النشر؟ */
export function useRequireFacilityVerification() {
  const { data } = usePlatformSettings();
  return settingEnabled(data, "require_facility_verification");
}

/** هل يشترط توثيق الكادر قبل التقديم/الحجز؟ */
export function useRequireProfessionalVerification() {
  const { data } = usePlatformSettings();
  return settingEnabled(data, "require_professional_verification");
}
