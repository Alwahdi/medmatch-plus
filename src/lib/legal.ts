/**
 * النصوص القانونية وبيانات التواصل التي يحررها المدير، وسجل موافقات المستخدمين.
 *
 * - `legal_documents`: نص كل وثيقة بالعربية والإنجليزية ورقم إصدارها.
 * - `user_consents`: موافقة المستخدم على وثيقة بإصدار محدد (يُفرض في قاعدة البيانات).
 * - رفع الإصدار من لوحة المدير يعيد طلب الموافقة من الجميع.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { type Lang } from "@/lib/format";

export type LegalKey =
  | "privacy"
  | "terms"
  | "applicant_commitments"
  | "publisher_commitments"
  | "contact_info";

export type LegalDocument = {
  key: LegalKey;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  meta: Record<string, unknown>;
  version: number;
  updated_at: string;
};

export type ContactMeta = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  hours_ar?: string;
  hours_en?: string;
};

export const LEGAL_QUERY_KEY = ["legal-documents"] as const;
export const CONSENTS_QUERY_KEY = ["my-consents"] as const;

export function useLegalDocuments() {
  return useQuery({
    queryKey: LEGAL_QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<LegalDocument[]> => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("key, title_ar, title_en, body_ar, body_en, meta, version, updated_at");
      if (error) throw error;
      return (data ?? []) as unknown as LegalDocument[];
    },
  });
}

export function useLegalDocument(key: LegalKey) {
  const { data, ...rest } = useLegalDocuments();
  return { ...rest, doc: data?.find((d) => d.key === key) ?? null };
}

/** نص الوثيقة بلغة المستخدم، أو `null` حين لم يضع المدير نصاً مخصصاً. */
export function legalBody(doc: LegalDocument | null, lang: Lang): string | null {
  if (!doc) return null;
  const body = lang === "en" ? doc.body_en || doc.body_ar : doc.body_ar || doc.body_en;
  return body && body.trim() ? body : null;
}

export function legalTitle(doc: LegalDocument | null, lang: Lang, fallback: string): string {
  if (!doc) return fallback;
  const t = lang === "en" ? doc.title_en || doc.title_ar : doc.title_ar || doc.title_en;
  return t?.trim() ? t : fallback;
}

export function contactMeta(doc: LegalDocument | null): ContactMeta {
  return (doc?.meta ?? {}) as ContactMeta;
}

/** موافقات المستخدم الحالي. */
export function useMyConsents(enabled = true) {
  return useQuery({
    queryKey: CONSENTS_QUERY_KEY,
    enabled,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_consents")
        .select("doc_key, version, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** هل وافق المستخدم على الإصدار الحالي من الوثيقة؟ */
export function hasConsent(
  consents: { doc_key: string; version: number }[] | undefined,
  docs: LegalDocument[] | undefined,
  key: LegalKey,
): boolean {
  const version = docs?.find((d) => d.key === key)?.version;
  if (version == null) return true;
  return !!consents?.some((c) => c.doc_key === key && c.version >= version);
}

export function useRecordConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: LegalKey) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("NOT_SIGNED_IN");
      const { error } = await supabase
        .from("user_consents")
        .insert({ user_id: userId, doc_key: key, version: 1 });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONSENTS_QUERY_KEY });
    },
  });
}
