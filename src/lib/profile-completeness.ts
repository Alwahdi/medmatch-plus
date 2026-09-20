// المرحلة 80: نفس قواعد اكتمال الملف المطبّقة في قاعدة البيانات
// (private.professional_profile_complete / private.facility_profile_complete).
// تُستخدم هنا للعرض والتوجيه فقط؛ المنع الحقيقي يحدث في الخادم.

type ProfessionalLike = {
  full_name?: string | null;
  specialty_id?: string | null;
  country?: string | null;
  city?: string | null;
  years_experience?: number | null;
} | null | undefined;

type FacilityLike = {
  name_ar?: string | null;
  facility_type?: string | null;
  country?: string | null;
  city?: string | null;
} | null | undefined;

const filled = (v: string | null | undefined, min = 1) => (v ?? "").trim().length >= min;

export function isProfessionalProfileComplete(row: ProfessionalLike): boolean {
  if (!row) return false;
  const years = row.years_experience ?? -1;
  return (
    filled(row.full_name, 2) &&
    !!row.specialty_id &&
    filled(row.country) &&
    filled(row.city) &&
    years >= 0 &&
    years <= 60
  );
}

export function isFacilityProfileComplete(row: FacilityLike): boolean {
  if (!row) return false;
  return (
    filled(row.name_ar, 2) &&
    filled(row.facility_type) &&
    filled(row.country) &&
    filled(row.city)
  );
}
