import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Clock, CheckCircle2, XCircle, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, comboText, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { checkUpload } from "@/lib/storage";
import { useLang } from "@/lib/i18n";
import { countryLabel, facilityTypeLabel, facilityTypeOptions, specialtyName } from "@/lib/format";
import { cityOptions, countryOptions } from "@/lib/geo";
import { friendlyError, UserFacingError, userError } from "@/lib/user-errors";

export type ChangeTarget = "professional" | "facility" | "account";

export type SpecialtyRow = { id: string; name_ar: string; name_en: string };

/** محرّر القيمة المطلوبة — يعرض تسمية بشرية ويخزّن دائماً القيمة المعتمدة في قاعدة البيانات. */
export type ChangeEditor =
  | { kind: "text"; maxLength?: number; dir?: "ltr" }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "specialty" }
  | { kind: "country" }
  | { kind: "city"; country?: string | null }
  | { kind: "facilityType" };

export type ChangeRequestRow = {
  id: string;
  target: string;
  field: string;
  old_value: string | null;
  new_value: string;
  reason: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
};

const T = {
  ar: {
    locked: "مقفل بعد التوثيق",
    request: "طلب تعديل",
    title: "طلب تعديل بيانات موثّقة",
    desc: "سيراجع فريق المنصة طلبك، وسيصلك إشعار بالنتيجة.",
    current: "القيمة الحالية",
    next: "القيمة المطلوبة",
    reason: "سبب التعديل",
    reasonPh: "اشرح سبب الطلب، مثلاً: تغيير قانوني للاسم أو انتقال المنشأة.",
    file: "مستند داعم (اختياري)",
    fileHint: "PDF أو صورة (JPG، PNG، WEBP) بحجم أقصاه 10 ميغابايت.",
    cancel: "إلغاء",
    send: "إرسال الطلب",
    sending: "جارٍ الإرسال...",
    sent: "تم إرسال الطلب للمراجعة",
    failed: "تعذّر إرسال الطلب",
    dupe: "لديك طلب معلّق لنفس الحقل",
    need: "اختر أو أدخل القيمة الجديدة",
    same: "القيمة المطلوبة مطابقة للقيمة الحالية",
    badNumber: "أدخل رقماً صحيحاً بين {min} و{max}",
    tooLong: "القيمة أطول من الحد المسموح",
    badChoice: "اختر قيمة من القائمة",
    cityNote: "تأكد أن المدينة تتبع دولتك الحالية أو الدولة المطلوبة في طلب منفصل.",
    pending: "طلب تعديل قيد المراجعة",
    approved: "تم قبول طلب التعديل",
    rejected: "تم رفض طلب التعديل",
    myRequests: "طلبات تعديل بياناتي",
  },
  en: {
    locked: "Locked after verification",
    request: "Request change",
    title: "Request a verified data change",
    desc: "Our team reviews your request and notifies you of the result.",
    current: "Current value",
    next: "Requested value",
    reason: "Reason",
    reasonPh: "Explain why, e.g. a legal name change or a facility relocation.",
    file: "Supporting document (optional)",
    fileHint: "PDF or image (JPG, PNG, WEBP), 10MB max.",
    cancel: "Cancel",
    send: "Send request",
    sending: "Sending...",
    sent: "Request sent for review",
    failed: "Could not send the request",
    dupe: "You already have a pending request for this field",
    need: "Choose or enter the new value",
    same: "The requested value matches the current one",
    badNumber: "Enter a whole number between {min} and {max}",
    tooLong: "Value is longer than allowed",
    badChoice: "Pick a value from the list",
    cityNote: "Make sure the city belongs to your current country, or request the country change too.",
    pending: "Change request under review",
    approved: "Change request approved",
    rejected: "Change request rejected",
    myRequests: "My data change requests",
  },
} as const;

const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export function useSpecialtyList() {
  return useQuery({
    queryKey: ["specialties"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      if (error) throw error;
      return (data ?? []) as SpecialtyRow[];
    },
  });
}

export function useMyChangeRequests() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-change-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_change_requests")
        .select("id,target,field,old_value,new_value,reason,status,review_note,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChangeRequestRow[];
    },
  });
}

export function fieldLabel(field: string, lang: "ar" | "en") {
  const map: Record<string, [string, string]> = {
    full_name: ["الاسم الكامل", "Full name"],
    license_number: ["رقم الترخيص", "License number"],
    license_country: ["دولة الترخيص", "License country"],
    specialty_id: ["التخصص", "Specialty"],
    years_experience: ["سنوات الخبرة", "Years of experience"],
    city: ["المدينة", "City"],
    country: ["الدولة", "Country"],
    name_ar: ["اسم المنشأة (عربي)", "Facility name (Arabic)"],
    name_en: ["اسم المنشأة (إنجليزي)", "Facility name (English)"],
    facility_type: ["نوع المنشأة", "Facility type"],
    phone: ["رقم الجوال", "Phone"],
  };
  const pair = map[field];
  if (!pair) return field;
  return lang === "ar" ? pair[0] : pair[1];
}

/** تحويل القيمة المخزّنة (UUID/كود) إلى تسمية بشرية للعرض فقط. */
export function changeValueLabel(
  field: string,
  value: string | null | undefined,
  lang: "ar" | "en",
  specialties?: SpecialtyRow[] | undefined,
) {
  const v = (value ?? "").trim();
  if (!v) return "—";
  if (field === "specialty_id") {
    const row = specialties?.find((s) => s.id === v);
    return row ? specialtyName(row, lang) : v;
  }
  if (field === "country" || field === "license_country") return countryLabel(v, lang);
  if (field === "facility_type") return facilityTypeLabel(v, lang);
  return v;
}

/** هل تحتاج القيمة إظهار الصيغة التقنية بجانب التسمية (للمشرف)؟ */
export function isOpaqueChangeValue(field: string) {
  return field === "specialty_id";
}

/** Wraps a form field that is locked after verification and offers a review-backed change request. */
export function LockedField({
  label,
  inputId,
  locked,
  target,
  field,
  currentStoredValue,
  currentDisplayValue,
  editor = { kind: "text" },
  facilityId,
  children,
  pending,
}: {
  label: string;
  inputId?: string;
  locked: boolean;
  target: ChangeTarget;
  field: string;
  /** القيمة المعتمدة كما هي في قاعدة البيانات (UUID/كود/نص). */
  currentStoredValue: string;
  /** التسمية البشرية المعروضة للمستخدم — اختيارية، تُشتق تلقائياً عند غيابها. */
  currentDisplayValue?: string;
  editor?: ChangeEditor;
  facilityId?: string | null;
  children: ReactNode;
  pending?: ChangeRequestRow | undefined;
}) {
  const { lang } = useLang();
  const c = T[lang];
  const ct = comboText[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const needSpecialties = editor.kind === "specialty" || field === "specialty_id";
  const { data: specialties } = useSpecialtyList();

  const options: ComboboxOption[] = useMemo(() => {
    if (editor.kind === "specialty")
      return (specialties ?? []).map((s) => ({
        value: s.id,
        label: specialtyName(s, lang),
        keywords: [s.name_ar, s.name_en],
      }));
    if (editor.kind === "country") return countryOptions(lang);
    if (editor.kind === "city") return cityOptions(editor.country ?? null, lang);
    if (editor.kind === "facilityType") return facilityTypeOptions(lang);
    return [];
  }, [editor, specialties, lang]);

  const display = (v: string) =>
    changeValueLabel(field, v, lang, needSpecialties ? specialties : undefined);

  const currentLabel = currentDisplayValue ?? display(currentStoredValue);

  const validate = (v: string): string | null => {
    if (!v) return c.need;
    if (v === currentStoredValue.trim()) return c.same;
    if (editor.kind === "number") {
      const min = editor.min ?? 0;
      const max = editor.max ?? 60;
      const n = Number(v);
      if (!/^\d+$/.test(v) || !Number.isInteger(n) || n < min || n > max)
        return c.badNumber.replace("{min}", String(min)).replace("{max}", String(max));
      return null;
    }
    if (editor.kind === "text") {
      if (v.length > (editor.maxLength ?? 120)) return c.tooLong;
      return null;
    }
    if (editor.kind === "city") return v.length > 60 ? c.tooLong : null;
    return options.some((o) => o.value === v) ? null : c.badChoice;
  };

  const submit = useMutation({
    mutationFn: async () => {
      const value = next.trim();
      const invalidValue = validate(value);
      if (invalidValue) userError(invalidValue);
      let attachment: string | null = null;
      if (file) {
        const invalid = checkUpload(file, "document", lang);
        if (invalid) userError(invalid);
        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().slice(0, 5);
        const path = `${user!.id}/change-${field}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("credentials").upload(path, file);
        if (upErr) throw upErr;
        attachment = path;
      }
      const { error } = await supabase.from("profile_change_requests").insert({
        user_id: user!.id,
        facility_id: facilityId ?? null,
        target,
        field,
        old_value: currentStoredValue.trim() || null,
        new_value: value,
        reason: reason.trim() || null,
        attachment_path: attachment,
      });
      if (error) throw error.code === "23505" ? new UserFacingError(c.dupe) : error;
    },
    onSuccess: () => {
      toast.success(c.sent);
      setOpen(false);
      setNext("");
      setReason("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-change-requests"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  const nextId = `next-${field}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={inputId} className="flex items-center gap-1.5">
          {label}
          {locked && <Lock className="size-3.5 text-muted-foreground" />}
        </Label>
        {locked && !pending && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setNext(currentStoredValue);
              setOpen(true);
            }}
          >
            {c.request}
          </Button>
        )}
      </div>
      <div className="mt-1.5">{children}</div>
      {locked && (
        <p className="mt-1 text-xs text-muted-foreground">
          {pending ? `${c.pending}: ${display(pending.new_value)}` : c.locked}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{c.title}</DialogTitle>
            <DialogDescription>{c.desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">{c.current}</Label>
              <p className="mt-1 rounded-lg bg-surface px-3 py-2 text-sm">{currentLabel || "—"}</p>
            </div>
            <div>
              <Label htmlFor={nextId} id={`${nextId}-label`}>
                {c.next}
              </Label>
              <div className="mt-1.5">
                {editor.kind === "text" && (
                  <Input
                    id={nextId}
                    dir={editor.dir}
                    value={next}
                    maxLength={editor.maxLength ?? 120}
                    onChange={(e) => setNext(e.target.value)}
                  />
                )}
                {editor.kind === "number" && (
                  <Input
                    id={nextId}
                    type="number"
                    inputMode="numeric"
                    min={editor.min ?? 0}
                    max={editor.max ?? 60}
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                  />
                )}
                {(editor.kind === "specialty" ||
                  editor.kind === "country" ||
                  editor.kind === "facilityType" ||
                  editor.kind === "city") && (
                  <Combobox
                    id={nextId}
                    options={options}
                    value={next}
                    onChange={setNext}
                    ariaLabelledBy={`${nextId}-label`}
                    placeholder={ct.choose}
                    searchPlaceholder={ct.search}
                    emptyText={ct.empty}
                    allowCustom={editor.kind === "city"}
                    {...(editor.kind === "city" ? { customLabel: ct.add } : {})}
                  />
                )}
              </div>
              {editor.kind === "city" && <p className="mt-1 text-xs text-muted-foreground">{c.cityNote}</p>}
            </div>
            <div>
              <Label htmlFor={`reason-${field}`}>{c.reason}</Label>
              <Textarea
                id={`reason-${field}`}
                className="mt-1.5"
                rows={3}
                maxLength={500}
                placeholder={c.reasonPh}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`file-${field}`} className="flex items-center gap-1.5">
                <Paperclip className="size-3.5" /> {c.file}
              </Label>
              <Input
                id={`file-${field}`}
                type="file"
                accept={DOC_ACCEPT}
                className="mt-1.5"
                aria-describedby={`file-hint-${field}`}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p id={`file-hint-${field}`} className="mt-1 text-xs text-muted-foreground">
                {c.fileHint}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {c.cancel}
            </Button>
            <Button onClick={() => submit.mutate()} loading={submit.isPending}>
              {submit.isPending ? c.sending : c.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Compact list of the signed-in user's change requests. */
export function ChangeRequestsPanel({ requests }: { requests: ChangeRequestRow[] }) {
  const { lang } = useLang();
  const c = T[lang];
  const { data: specialties } = useSpecialtyList();
  if (!requests.length) return null;
  return (
    <div className="card-lift mt-6 rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-lg font-bold">{c.myRequests}</h2>
      <ul className="mt-3 space-y-2">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-sm"
          >
            <span className="font-medium">
              {fieldLabel(r.field, lang)}: {changeValueLabel(r.field, r.old_value, lang, specialties)} →{" "}
              {changeValueLabel(r.field, r.new_value, lang, specialties)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {r.status === "pending" && <Clock className="size-3.5" />}
              {r.status === "approved" && <CheckCircle2 className="size-3.5 text-emerald-600" />}
              {r.status === "rejected" && <XCircle className="size-3.5 text-destructive" />}
              {r.status === "pending" ? c.pending : r.status === "approved" ? c.approved : c.rejected}
              {r.review_note ? ` — ${r.review_note}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
