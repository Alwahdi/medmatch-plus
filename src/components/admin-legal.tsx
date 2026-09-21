import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ListSkeleton } from "@/components/list-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import {
  LEGAL_QUERY_KEY,
  type ContactMeta,
  type LegalKey,
  useLegalDocuments,
} from "@/lib/legal";
import { friendlyError } from "@/lib/user-errors";

const KEYS: { key: LegalKey; ar: string; en: string }[] = [
  { key: "privacy", ar: "سياسة الخصوصية", en: "Privacy policy" },
  { key: "terms", ar: "الشروط والأحكام", en: "Terms & conditions" },
  { key: "applicant_commitments", ar: "التزامات المتقدم", en: "Applicant commitments" },
  { key: "publisher_commitments", ar: "التزامات الناشر", en: "Publisher commitments" },
  { key: "contact_info", ar: "بيانات التواصل", en: "Contact details" },
];

const TXT = {
  ar: {
    title: "المحتوى القانوني وبيانات التواصل",
    subtitle: "النص هنا هو ما يظهر للمستخدمين في صفحات الخصوصية والشروط والتواصل ونافذة الموافقة.",
    titleAr: "العنوان (عربي)",
    titleEn: "العنوان (إنجليزي)",
    bodyAr: "النص (عربي)",
    bodyEn: "النص (إنجليزي)",
    bodyHint: "كل سطر يظهر كبند مستقل في نافذة الموافقة.",
    bump: "اعتبره تحديثاً جوهرياً (يطلب موافقة جديدة من الجميع)",
    save: "حفظ",
    saved: "تم حفظ المحتوى",
    failed: "تعذّر حفظ المحتوى",
    version: (v: number) => `الإصدار ${v}`,
    updated: "آخر تحديث",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    whatsapp: "واتساب",
    address: "العنوان",
    hours: "أوقات العمل (عربي)",
    hoursEn: "أوقات العمل (إنجليزي)",
  },
  en: {
    title: "Legal content and contact details",
    subtitle: "This text is what users see on the privacy, terms and contact pages and in the consent dialog.",
    titleAr: "Title (Arabic)",
    titleEn: "Title (English)",
    bodyAr: "Body (Arabic)",
    bodyEn: "Body (English)",
    bodyHint: "Each line appears as a separate bullet in the consent dialog.",
    bump: "Treat as a material update (asks everyone to consent again)",
    save: "Save",
    saved: "Content saved",
    failed: "Could not save the content",
    version: (v: number) => `Version ${v}`,
    updated: "Last updated",
    email: "Email",
    phone: "Phone",
    whatsapp: "WhatsApp",
    address: "Address",
    hours: "Working hours (Arabic)",
    hoursEn: "Working hours (English)",
  },
} as const;

export function AdminLegalContent() {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const { data: docs, isLoading } = useLegalDocuments();

  const [active, setActive] = useState<LegalKey>("privacy");
  const [form, setForm] = useState({ title_ar: "", title_en: "", body_ar: "", body_en: "" });
  const [meta, setMeta] = useState<ContactMeta>({});
  const [bump, setBump] = useState(false);

  const doc = docs?.find((d) => d.key === active) ?? null;

  useEffect(() => {
    setForm({
      title_ar: doc?.title_ar ?? "",
      title_en: doc?.title_en ?? "",
      body_ar: doc?.body_ar ?? "",
      body_en: doc?.body_en ?? "",
    });
    setMeta((doc?.meta ?? {}) as ContactMeta);
    setBump(false);
  }, [doc]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_upsert_legal_document", {
        _key: active,
        _title_ar: form.title_ar.trim(),
        _title_en: form.title_en.trim() || form.title_ar.trim(),
        _body_ar: form.body_ar,
        _body_en: form.body_en,
        _meta: meta as never,
        _bump_version: bump,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.saved);
      void queryClient.invalidateQueries({ queryKey: LEGAL_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["my-consents"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e.message, lang) || c.failed),
  });

  if (isLoading) return <ListSkeleton rows={5} />;

  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-lg font-extrabold">{c.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {KEYS.map((k) => (
          <Button
            key={k.key}
            variant={active === k.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(k.key)}
          >
            {lang === "en" ? k.en : k.ar}
          </Button>
        ))}
      </div>

      {doc && (
        <p className="text-xs text-muted-foreground">
          {c.version(doc.version)} — {c.updated}: {formatDateTime(doc.updated_at, lang)}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold" htmlFor="legal-title-ar">{c.titleAr}</label>
          <Input
            id="legal-title-ar"
            value={form.title_ar}
            onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="legal-title-en">{c.titleEn}</label>
          <Input
            id="legal-title-en"
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
            className="mt-1.5"
            dir="ltr"
          />
        </div>
      </div>

      {active === "contact_info" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["email", c.email, "ltr"],
            ["phone", c.phone, "ltr"],
            ["whatsapp", c.whatsapp, "ltr"],
            ["address", c.address, "auto"],
            ["hours_ar", c.hours, "auto"],
            ["hours_en", c.hoursEn, "ltr"],
          ] as const).map(([field, label, dir]) => (
            <div key={field}>
              <label className="text-sm font-semibold" htmlFor={`contact-${field}`}>{label}</label>
              <Input
                id={`contact-${field}`}
                value={meta[field] ?? ""}
                onChange={(e) => setMeta({ ...meta, [field]: e.target.value })}
                className="mt-1.5"
                dir={dir === "auto" ? undefined : dir}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <label className="text-sm font-semibold" htmlFor="legal-body-ar">{c.bodyAr}</label>
          <Textarea
            id="legal-body-ar"
            value={form.body_ar}
            onChange={(e) => setForm({ ...form, body_ar: e.target.value })}
            rows={14}
            className="mt-1.5 font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="legal-body-en">{c.bodyEn}</label>
          <Textarea
            id="legal-body-en"
            value={form.body_en}
            onChange={(e) => setForm({ ...form, body_en: e.target.value })}
            rows={14}
            dir="ltr"
            className="mt-1.5 font-mono text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{c.bodyHint}</p>

      <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
        <span>{c.bump}</span>
        <Switch checked={bump} onCheckedChange={setBump} aria-label={c.bump} />
      </label>

      <Button className="min-h-11" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="size-4 animate-spin" />}
        {c.save}
      </Button>
    </section>
  );
}
