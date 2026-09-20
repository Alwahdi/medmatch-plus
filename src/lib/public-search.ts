import { supabase } from "@/integrations/supabase/client";
import { withSpecialties } from "@/lib/public-listings";
import type { JobRow } from "@/components/job-card";
import type { ShiftRow } from "@/components/shift-card";

/**
 * Phase 87 — بحث الفرص العامة من جهة الخادم.
 *
 * التصفية والترتيب والتقسيم إلى صفحات تتم كلها في قاعدة البيانات عبر دالتين
 * تقرآن حصراً من العرضين المنقّحين public_jobs / public_shifts. لا نجلب كل
 * الصفوف إلى المتصفح، وحجم الصفحة محدود خادمياً بـ50.
 */

export const PAGE_SIZE_SINGLE = 20;
export const PAGE_SIZE_MIXED = 10;

export type SearchFilters = {
  q: string;
  country: string | null;
  city: string | null;
  specialtyId: string | null;
  specialtyIds: string[] | null;
  type: string | null;
  sort: "match" | "new";
  prefSpecialtyId: string | null;
  prefCountry: string | null;
  excludeJobIds: string[] | null;
};

export type SearchJobRow = JobRow & {
  specialty_id: string | null;
  required_license: string | null;
};

export type SearchShiftRow = ShiftRow & { specialty_id: string | null };

export type Page<T> = { rows: T[]; total: number; offset: number };

const clean = (v: string | null | undefined) => (v && v !== "all" ? v : undefined);
const orUndef = <T,>(v: T | null | undefined) => v ?? undefined;

export async function searchPublicJobs(
  f: SearchFilters,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<Page<SearchJobRow>> {
  const { data, error } = await supabase
    .rpc("search_public_jobs", {
      _q: f.q ? f.q.slice(0, 80) : undefined,
      _country: clean(f.country),
      _city: clean(f.city),
      _specialty_id: clean(f.specialtyId),
      _specialty_ids: orUndef(f.specialtyIds),
      _type: clean(f.type),
      _pref_specialty_id: orUndef(f.prefSpecialtyId),
      _pref_country: orUndef(f.prefCountry),
      _sort: f.sort,
      _exclude_ids: orUndef(f.excludeJobIds),
      _limit: limit,
      _offset: offset,
    })
    .abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  const rows = (data ?? []) as { total_count: number }[];
  return {
    rows: withSpecialties(rows as never) as unknown as SearchJobRow[],
    total: rows.length ? Number(rows[0]!.total_count) : 0,
    offset,
  };
}

export async function searchPublicShifts(
  f: SearchFilters,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<Page<SearchShiftRow>> {
  const { data, error } = await supabase
    .rpc("search_public_shifts", {
      _q: f.q ? f.q.slice(0, 80) : undefined,
      _country: clean(f.country),
      _city: clean(f.city),
      _specialty_id: clean(f.specialtyId),
      _specialty_ids: orUndef(f.specialtyIds),
      _pref_specialty_id: orUndef(f.prefSpecialtyId),
      _pref_country: orUndef(f.prefCountry),
      _sort: f.sort,
      _limit: limit,
      _offset: offset,
    })
    .abortSignal(signal ?? new AbortController().signal);
  if (error) throw error;
  const rows = (data ?? []) as { total_count: number }[];
  return {
    rows: withSpecialties(rows as never) as unknown as SearchShiftRow[],
    total: rows.length ? Number(rows[0]!.total_count) : 0,
    offset,
  };
}

export async function fetchListingPlaces() {
  const { data, error } = await supabase.rpc("public_listing_places");
  if (error) throw error;
  return (data ?? []) as { country: string; city: string | null }[];
}
