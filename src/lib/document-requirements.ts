import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

/**
 * متطلبات المستندات يضبطها الأدمن من لوحة الإدارة (جدول document_requirements).
 * كل الواجهات (رفع المستندات، شريط المطلوبات، لوحة المراجعة) تقرأ من هنا،
 * ومنح التوثيق في قاعدة البيانات يعتمد على الأنواع المعلَّمة «مطلوبة».
 */
export type DocTarget = "professional" | "facility";

export type DocRequirement = {
  id: string;
  target: DocTarget;
  code: string;
  name_ar: string;
  name_en: string;
  is_required: boolean;
  min_count: number;
  requires_expiry: boolean;
  requires_issue_date: boolean;
  requires_issuer: boolean;
  note_ar: string | null;
  note_en: string | null;
  sort_order: number;
  is_active: boolean;
};

async function fetchRequirements(target: DocTarget, includeInactive: boolean) {
  let q = supabase
    .from("document_requirements")
    .select("*")
    .eq("target", target)
    .order("sort_order", { ascending: true });
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DocRequirement[];
}

/** الأنواع المفعّلة فقط — ما يراه المستخدم. */
export function useDocumentRequirements(target: DocTarget) {
  return useQuery({
    queryKey: ["doc-requirements", target],
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchRequirements(target, false),
  });
}

/** كل الأنواع بما فيها الموقوفة — للوحة الإدارة. */
export function useAllDocumentRequirements(target: DocTarget) {
  return useQuery({
    queryKey: ["doc-requirements-all", target],
    queryFn: () => fetchRequirements(target, true),
  });
}

export function reqName(r: Pick<DocRequirement, "name_ar" | "name_en">, lang: Lang) {
  return lang === "en" ? r.name_en || r.name_ar : r.name_ar;
}

export function reqNote(r: Pick<DocRequirement, "note_ar" | "note_en">, lang: Lang) {
  return (lang === "en" ? r.note_en || r.note_ar : r.note_ar) ?? null;
}

/** أسماء الأنواع المطلوبة فقط. */
export function requiredCodes(rows: DocRequirement[] | undefined) {
  return (rows ?? []).filter((r) => r.is_required).map((r) => r.code);
}
