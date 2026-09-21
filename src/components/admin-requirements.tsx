import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";
import {
  type DocRequirement,
  type DocTarget,
  useAllDocumentRequirements,
} from "@/lib/document-requirements";

const TXT = {
  ar: {
    title: "متطلبات المستندات",
    sub: "اضبط أنواع المستندات التي تظهر للمستخدمين: الاسم، هل هي مطلوبة، عدد الملفات، والحقول الإلزامية. الأنواع الموقوفة لا تظهر في صفحات الرفع.",
    pro: "مستندات الكادر",
    fac: "مستندات المنشآت",
    nameAr: "الاسم بالعربية",
    nameEn: "الاسم بالإنجليزية",
    code: "الرمز الثابت",
    codeHint: "لا يُعدَّل بعد الحفظ — يُربط بالمستندات المرفوعة.",
    required: "مطلوب للتوثيق",
    minCount: "عدد الملفات المطلوب",
    expiry: "تاريخ الانتهاء إلزامي",
    issueDate: "تاريخ الإصدار إلزامي",
    issuer: "جهة الإصدار إلزامية",
    noteAr: "ملاحظة للمستخدم (عربي)",
    noteEn: "ملاحظة للمستخدم (إنجليزي)",
    order: "ترتيب العرض",
    active: "مفعّل",
    save: "حفظ",
    add: "إضافة نوع مستند",
    saved: "تم الحفظ",
    saveFailed: "تعذّر الحفظ",
    empty: "لا توجد أنواع مستندات بعد.",
    loading: "جارٍ التحميل…",
    newCode: "اكتب رمزاً ثابتاً واسماً قبل الحفظ.",
  },
  en: {
    title: "Document requirements",
    sub: "Configure the document types users see: name, whether required, file count, and mandatory fields. Disabled types are hidden from upload pages.",
    pro: "Professional documents",
    fac: "Facility documents",
    nameAr: "Arabic name",
    nameEn: "English name",
    code: "Stable code",
    codeHint: "Cannot change after saving — it links to uploaded documents.",
    required: "Required for verification",
    minCount: "Files required",
    expiry: "Expiry date mandatory",
    issueDate: "Issue date mandatory",
    issuer: "Issuer mandatory",
    noteAr: "User note (Arabic)",
    noteEn: "User note (English)",
    order: "Display order",
    active: "Active",
    save: "Save",
    add: "Add document type",
    saved: "Saved",
    saveFailed: "Could not save",
    empty: "No document types yet.",
    loading: "Loading…",
    newCode: "Enter a stable code and a name before saving.",
  },
} as const;

type Draft = Omit<DocRequirement, "id"> & { id: string | null };

function emptyDraft(target: DocTarget, sort: number): Draft {
  return {
    id: null,
    target,
    code: "",
    name_ar: "",
    name_en: "",
    is_required: false,
    min_count: 1,
    requires_expiry: false,
    requires_issue_date: false,
    requires_issuer: false,
    note_ar: null,
    note_en: null,
    sort_order: sort,
    is_active: true,
  };
}

function RequirementsList({ target }: { target: DocTarget }) {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const { data, isPending } = useAllDocumentRequirements(target);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newRow, setNewRow] = useState<Draft | null>(null);

  const rows = data ?? [];

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      if (!d.code.trim() || !d.name_ar.trim()) throw new Error(c.newCode);
      const { error } = await supabase.rpc("admin_upsert_document_requirement", {
        _id: d.id ?? "",
        _target: d.target,
        _code: d.code.trim(),
        _name_ar: d.name_ar.trim(),
        _name_en: d.name_en.trim() || d.name_ar.trim(),
        _is_required: d.is_required,
        _min_count: d.min_count,
        _requires_expiry: d.requires_expiry,
        _requires_issue_date: d.requires_issue_date,
        _requires_issuer: d.requires_issuer,
        _note_ar: d.note_ar ?? "",
        _note_en: d.note_en ?? "",
        _sort_order: d.sort_order,
        _is_active: d.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.saved);
      setNewRow(null);
      setDrafts({});
      queryClient.invalidateQueries({ queryKey: ["doc-requirements-all", target] });
      queryClient.invalidateQueries({ queryKey: ["doc-requirements", target] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  function draftFor(r: DocRequirement): Draft {
    return drafts[r.id] ?? { ...r };
  }

  function patch(r: DocRequirement, next: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [r.id]: { ...(prev[r.id] ?? { ...r }), ...next } }));
  }

  function Editor({
    d,
    onChange,
    onSave,
    isNew,
  }: {
    d: Draft;
    onChange: (next: Partial<Draft>) => void;
    onSave: () => void;
    isNew: boolean;
  }) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{c.nameAr}</Label>
            <Input value={d.name_ar} maxLength={120} onChange={(e) => onChange({ name_ar: e.target.value })} />
          </div>
          <div>
            <Label>{c.nameEn}</Label>
            <Input value={d.name_en} maxLength={120} onChange={(e) => onChange({ name_en: e.target.value })} />
          </div>
          {isNew ? (
            <div className="sm:col-span-2">
              <Label>{c.code}</Label>
              <Input value={d.code} maxLength={80} onChange={(e) => onChange({ code: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">{c.codeHint}</p>
            </div>
          ) : null}
          <div>
            <Label>{c.minCount}</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={d.min_count}
              onChange={(e) => onChange({ min_count: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
            />
          </div>
          <div>
            <Label>{c.order}</Label>
            <Input
              type="number"
              min={0}
              value={d.sort_order}
              onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>{c.noteAr}</Label>
            <Input
              value={d.note_ar ?? ""}
              maxLength={200}
              onChange={(e) => onChange({ note_ar: e.target.value || null })}
            />
          </div>
          <div>
            <Label>{c.noteEn}</Label>
            <Input
              value={d.note_en ?? ""}
              maxLength={200}
              onChange={(e) => onChange({ note_en: e.target.value || null })}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["is_required", c.required],
              ["requires_expiry", c.expiry],
              ["requires_issue_date", c.issueDate],
              ["requires_issuer", c.issuer],
              ["is_active", c.active],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
              <span className="text-sm">{label}</span>
              <Switch checked={d[key]} onCheckedChange={(v) => onChange({ [key]: v } as Partial<Draft>)} />
            </label>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={onSave} loading={save.isPending}>
            <Save className="size-4" /> {c.save}
          </Button>
        </div>
      </div>
    );
  }

  if (isPending)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {c.loading}
      </p>
    );

  return (
    <div className="space-y-4">
      {rows.length === 0 && !newRow ? (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {c.empty}
        </p>
      ) : null}

      {rows.map((r) => {
        const d = draftFor(r);
        return (
          <Editor
            key={r.id}
            d={d}
            isNew={false}
            onChange={(next) => patch(r, next)}
            onSave={() => save.mutate(d)}
          />
        );
      })}

      {newRow ? (
        <Editor
          d={newRow}
          isNew
          onChange={(next) => setNewRow({ ...newRow, ...next })}
          onSave={() => save.mutate(newRow)}
        />
      ) : (
        <Button
          variant="outline"
          onClick={() => setNewRow(emptyDraft(target, (rows.at(-1)?.sort_order ?? 0) + 10))}
        >
          <Plus className="size-4" /> {c.add}
        </Button>
      )}
    </div>
  );
}

export function AdminDocumentRequirements() {
  const { lang } = useLang();
  const c = TXT[lang];

  return (
    <div>
      <h2 className="text-lg font-bold">{c.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>

      <Tabs defaultValue="professional" className="mt-5">
        <TabsList>
          <TabsTrigger value="professional">{c.pro}</TabsTrigger>
          <TabsTrigger value="facility">{c.fac}</TabsTrigger>
        </TabsList>
        <TabsContent value="professional" className="mt-5">
          <RequirementsList target="professional" />
        </TabsContent>
        <TabsContent value="facility" className="mt-5">
          <RequirementsList target="facility" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
