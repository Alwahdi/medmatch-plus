import { supabase } from "@/integrations/supabase/client";

/**
 * Sanitized public browsing surface (Phase 47).
 *
 * التصفح العام للوظائف والمناوبات يمر عبر عرضين مُنقّحين في قاعدة البيانات
 * لا يحتويان على اسم الناشر ولا بيانات المالك ولا هوية من حجز المناوبة،
 * ويعرضان فقط الفرص المفتوحة. لا نستخدم select('*') إطلاقاً على هذه المصادر.
 */

export const PUBLIC_JOB_COLUMNS =
  "id,slug,title,description,specialty_id,specialty_name_ar,specialty_name_en,employment_type,country,city,salary_min,salary_max,currency,min_experience,required_license,created_at,expires_at,is_featured,facility_verified,applications_count,vacancies,facility_id";

export const PUBLIC_SHIFT_COLUMNS =
  "id,title,notes,specialty_id,specialty_name_ar,specialty_name_en,starts_at,ends_at,hourly_rate,currency,country,city,status,is_urgent,facility_verified,applications_count,created_at,facility_id";

/** أعمدة الجداول الأصلية المسموح عرضها لمالك الفرصة أو من له تعامل معها (بدون اسم الناشر). */
export const OWNER_JOB_COLUMNS =
  "id,slug,title,description,specialty_id,employment_type,country,city,salary_min,salary_max,currency,min_experience,required_license,created_at,expires_at,is_featured,facility_verified,applications_count,vacancies,facility_id,is_active,specialties(name_ar,name_en)";

export const OWNER_SHIFT_COLUMNS =
  "id,title,notes,specialty_id,starts_at,ends_at,hourly_rate,currency,country,city,status,is_urgent,facility_verified,applications_count,created_at,facility_id,specialties(name_ar,name_en)";

type SpecialtyNames = {
  specialty_name_ar?: string | null;
  specialty_name_en?: string | null;
};

/** يحوّل أعمدة اسم التخصص في العرض العام إلى نفس شكل العلاقة المستخدم في البطاقات. */
export function withSpecialty<T extends SpecialtyNames>(row: T) {
  const { specialty_name_ar, specialty_name_en, ...rest } = row;
  return {
    ...rest,
    specialties: specialty_name_ar
      ? { name_ar: specialty_name_ar, name_en: specialty_name_en ?? specialty_name_ar }
      : null,
  };
}

export function withSpecialties<T extends SpecialtyNames>(rows: T[] | null | undefined) {
  return (rows ?? []).map(withSpecialty);
}

export const publicJobsQuery = () => supabase.from("public_jobs").select(PUBLIC_JOB_COLUMNS);
export const publicShiftsQuery = () => supabase.from("public_shifts").select(PUBLIC_SHIFT_COLUMNS);
