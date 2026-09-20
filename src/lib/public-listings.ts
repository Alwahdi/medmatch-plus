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

/**
 * أعمدة لوحة إدارة المنشأة (Phase 92): كل أعمدة الجدول الأصلي عدا الأعمدة الحاملة للهوية
 * (`jobs.publisher_name` و`shifts.booked_by`) التي لم تعد ممنوحة للعميل أصلاً.
 * لا نستخدم select('*') لأنه يفشل عند وجود عمود بلا صلاحية قراءة.
 */
export const FACILITY_JOB_COLUMNS =
  "id,facility_id,title,description,specialty_id,employment_type,country,city,salary_min,salary_max,currency,min_experience,required_license,is_active,created_at,updated_at,is_featured,expires_at,applications_count,facility_verified,slug,vacancies,auto_closed";

export const FACILITY_SHIFT_COLUMNS =
  "id,facility_id,specialty_id,title,notes,starts_at,ends_at,hourly_rate,currency,country,city,status,created_at,updated_at,is_urgent,applications_count,facility_verified";

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

import type { Database } from "@/integrations/supabase/types";

type SpecialtyLabel = { name_ar: string; name_en: string } | null;

export type PublicJobRow = {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  specialty_id: string | null;
  employment_type: Database["public"]["Enums"]["employment_type"];
  country: string;
  city: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  min_experience: number;
  required_license: string | null;
  created_at: string;
  expires_at: string | null;
  is_featured: boolean;
  facility_verified: boolean;
  applications_count: number;
  vacancies: number;
  facility_id: string;
  specialties: SpecialtyLabel;
};

export type PublicShiftRow = {
  id: string;
  title: string;
  notes: string | null;
  specialty_id: string | null;
  starts_at: string;
  ends_at: string;
  hourly_rate: number;
  currency: string;
  country: string;
  city: string;
  status: Database["public"]["Enums"]["shift_status"];
  is_urgent: boolean;
  facility_verified: boolean;
  applications_count: number;
  created_at: string;
  facility_id: string;
  specialties: SpecialtyLabel;
};

export const toPublicJob = (row: SpecialtyNames) => withSpecialty(row) as unknown as PublicJobRow;
export const toPublicShift = (row: SpecialtyNames) => withSpecialty(row) as unknown as PublicShiftRow;
