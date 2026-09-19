import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Clock, CheckCircle2, XCircle, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { friendlyError, UserFacingError } from "@/lib/user-errors";

export type ChangeTarget = "professional" | "facility" | "account";

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
    cancel: "إلغاء",
    send: "إرسال الطلب",
    sending: "جارٍ الإرسال...",
    sent: "تم إرسال الطلب للمراجعة",
    failed: "تعذّر إرسال الطلب",
    dupe: "لديك طلب معلّق لنفس الحقل",
    need: "أدخل القيمة الجديدة",
    pending: "طلب تعديل قيد المراجعة",
    approved: "تم قبول طلب التعديل",
    rejected: "تم رفض طلب التعديل",
    myRequests: "طلبات تعديل بياناتي",
    big: "حجم الملف يجب ألا يتجاوز 10 ميغابايت",
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
    cancel: "Cancel",
    send: "Send request",
    sending: "Sending...",
    sent: "Request sent for review",
    failed: "Could not send the request",
    dupe: "You already have a pending request for this field",
    need: "Enter the new value",
    pending: "Change request under review",
    approved: "Change request approved",
    rejected: "Change request rejected",
    myRequests: "My data change requests",
    big: "File must be 10MB or smaller",
  },
} as const;

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

/** Wraps a form field that is locked after verification and offers a review-backed change request. */
export function LockedField({
  label,
  locked,
  target,
  field,
  currentValue,
  facilityId,
  children,
  pending,
}: {
  label: string;
  locked: boolean;
  target: ChangeTarget;
  field: string;
  currentValue: string;
  facilityId?: string | null;
  children: ReactNode;
  pending?: ChangeRequestRow | undefined;
}) {
  const { lang } = useLang();
  const c = T[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (!next.trim()) throw new Error(c.need);
      let attachment: string | null = null;
      if (file) {
        const invalid = checkUpload(file, "document", lang);
        if (invalid) throw new Error(invalid);
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
        old_value: currentValue || null,
        new_value: next.trim(),
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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5">
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
              setNext(currentValue);
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
          {pending ? `${c.pending}: ${pending.new_value}` : c.locked}
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
              <p className="mt-1 rounded-lg bg-surface px-3 py-2 text-sm">{currentValue || "—"}</p>
            </div>
            <div>
              <Label htmlFor={`next-${field}`}>{c.next}</Label>
              <Input
                id={`next-${field}`}
                className="mt-1.5"
                value={next}
                maxLength={120}
                onChange={(e) => setNext(e.target.value)}
              />
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
                className="mt-1.5"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
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
              {fieldLabel(r.field, lang)}: {r.old_value || "—"} → {r.new_value}
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
