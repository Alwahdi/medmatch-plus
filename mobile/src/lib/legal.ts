import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import type { Lang } from "./i18n";

export type LegalKey =
  | "privacy"
  | "terms"
  | "applicant_commitments"
  | "publisher_commitments"
  | "contact_info";

export type LegalDocument = {
  key: string;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  version: number;
  meta: unknown;
};

export function useLegalDocuments() {
  return useQuery({
    queryKey: ["legal-documents"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const res = await supabase
        .from("legal_documents")
        .select("key,title_ar,title_en,body_ar,body_en,version,meta");
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []) as LegalDocument[];
    },
  });
}

export function useLegalDocument(key: LegalKey) {
  const q = useLegalDocuments();
  return { ...q, document: (q.data ?? []).find((d) => d.key === key) ?? null };
}

export const legalTitle = (doc: LegalDocument | null, lang: Lang) =>
  (lang === "ar" ? doc?.title_ar : doc?.title_en || doc?.title_ar) ?? "";

export const legalBody = (doc: LegalDocument | null, lang: Lang) =>
  (lang === "ar" ? doc?.body_ar : doc?.body_en || doc?.body_ar) ?? "";

export function useMyConsents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-consents", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await supabase.from("user_consents").select("doc_key,version,created_at");
      if (res.error) throw new Error(res.error.message);
      return res.data ?? [];
    },
  });
}

export function useRecordConsent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ key, version }: { key: LegalKey; version: number }) => {
      const res = await supabase
        .from("user_consents")
        .upsert({ user_id: user!.id, doc_key: key, version }, { onConflict: "user_id,doc_key" });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["my-consents"] }),
  });
}
