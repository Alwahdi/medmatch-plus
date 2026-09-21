/**
 * المواقع (الدول ← المحافظات ← المديريات/المدن) — المصدر الحيّ من قاعدة البيانات.
 *
 * المدير يتحكم بالقائمة من لوحة التحكم عبر جدول `locations`.
 * تبقى قائمة `@/lib/geo` الثابتة كاحتياطي فقط أثناء التحميل أو تعذّر الجلب،
 * حتى لا تفرغ قوائم الاختيار في أي حال.
 */

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { countryCodeOf } from "@/lib/countries";
import { type Lang } from "@/lib/format";
import {
  type Option,
  allCityOptions as staticAllCityOptions,
  cityOptions as staticCityOptions,
} from "@/lib/geo";

export type LocationRow = {
  id: string;
  country: string;
  region_ar: string;
  region_en: string;
  city_ar: string;
  city_en: string;
  sort_order: number;
  is_active: boolean;
};

export const LOCATIONS_QUERY_KEY = ["locations"] as const;

async function fetchLocations(includeInactive: boolean): Promise<LocationRow[]> {
  let q = supabase
    .from("locations")
    .select("id, country, region_ar, region_en, city_ar, city_en, sort_order, is_active")
    .order("country", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("city_ar", { ascending: true });
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as LocationRow[];
}

/** كل المواقع المفعّلة (للمستخدمين). */
export function useLocations() {
  return useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    staleTime: 10 * 60 * 1000,
    queryFn: () => fetchLocations(false),
  });
}

/** كل المواقع بما فيها الموقوفة (للوحة المدير). */
export function useAllLocations() {
  return useQuery({
    queryKey: [...LOCATIONS_QUERY_KEY, "all"],
    staleTime: 60 * 1000,
    queryFn: () => fetchLocations(true),
  });
}

function sameCountry(row: LocationRow, stored: string | null | undefined) {
  if (!stored) return false;
  const code = countryCodeOf(stored);
  const rowCode = countryCodeOf(row.country);
  return code && rowCode ? code === rowCode : row.country === stored;
}

function toOption(row: LocationRow, lang: Lang, withCountry?: string): Option {
  const city = lang === "en" ? row.city_en || row.city_ar : row.city_ar;
  return {
    value: row.city_ar,
    label: withCountry ? `${city} — ${withCountry}` : city,
    keywords: [row.city_ar, row.city_en, row.region_ar, row.region_en, row.country],
  };
}

function dedupe(options: Option[]): Option[] {
  const seen = new Set<string>();
  return options.filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)));
}

/** مدن دولة محددة من صفوف محمّلة مسبقاً (دالة نقية — آمنة داخل JSX). */
export function cityOptionsFrom(
  data: LocationRow[] | undefined,
  stored: string | null | undefined,
  lang: Lang = "ar",
): Option[] {
  if (!stored) return [];
  if (!data || data.length === 0) return staticCityOptions(stored, lang);
  const rows = data.filter((r) => sameCountry(r, stored));
  if (rows.length === 0) return staticCityOptions(stored, lang);
  return dedupe(rows.map((r) => toOption(r, lang)));
}

/** خيارات الفلاتر من صفوف محمّلة مسبقاً: كل المدن حين لا تُحدَّد دولة. */
export function filterCityOptionsFrom(
  data: LocationRow[] | undefined,
  stored: string | null | undefined,
  lang: Lang = "ar",
): Option[] {
  const hasCountry = !!stored && !!countryCodeOf(stored);
  if (hasCountry) {
    if (!data || data.length === 0) return staticCityOptions(stored, lang);
    const rows = data.filter((r) => sameCountry(r, stored));
    return rows.length === 0
      ? staticCityOptions(stored, lang)
      : dedupe(rows.map((r) => toOption(r, lang)));
  }
  if (!data || data.length === 0) return staticAllCityOptions(lang);
  return dedupe(data.map((r) => toOption(r, lang, r.country)));
}

/** خيارات المحافظات لدولة (تستخدمها لوحة المدير). */
export function regionsOf(rows: LocationRow[], country: string): string[] {
  const seen = new Set<string>();
  for (const r of rows) if (r.country === country) seen.add(r.region_ar);
  return [...seen];
}

/** الدول الموجودة فعلياً في جدول المواقع. */
export function countriesOf(rows: LocationRow[]): string[] {
  const seen = new Set<string>();
  for (const r of rows) seen.add(r.country);
  return [...seen];
}

/** نسخ hook مختصرة لمن لا يحتاج تمرير الصفوف يدوياً. */
export function useCityOptions(stored: string | null | undefined, lang: Lang = "ar"): Option[] {
  const { data } = useLocations();
  return cityOptionsFrom(data, stored, lang);
}

export function useFilterCityOptions(
  stored: string | null | undefined,
  lang: Lang = "ar",
): Option[] {
  const { data } = useLocations();
  return filterCityOptionsFrom(data, stored, lang);
}
