import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, MapPin, Phone, Video, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RatingInput } from "@/components/rating-stars";
import { useConfirm } from "@/components/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";

type Lang = "ar" | "en";

export type InterviewRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  mode: string;
  location: string | null;
  meeting_url: string | null;
  notes: string | null;
  status: string;
  candidate_note: string | null;
  outcome_rating: number | null;
  outcome_note: string | null;
};

const SELECT =
  "id,scheduled_at,duration_minutes,mode,location,meeting_url,notes,status,candidate_note,outcome_rating,outcome_note";

const TXT = {
  ar: {
    interview: "المقابلة",
    schedule: "جدولة مقابلة",
    reschedule: "تغيير الموعد",
    scheduleTitle: (n: string) => `جدولة مقابلة مع ${n}`,
    scheduleDesc: "حدّد الموعد وطريقة المقابلة. يصل المرشح إشعار ويقدر يؤكد أو يعتذر.",
    when: "موعد المقابلة",
    duration: "المدة (دقيقة)",
    mode: "طريقة المقابلة",
    video: "عبر الفيديو",
    phone: "هاتفياً",
    onsite: "حضورياً في المنشأة",
    link: "رابط الاجتماع",
    place: "العنوان / مكان المقابلة",
    notes: "ملاحظات للمرشح (اختياري)",
    notesPh: "ما المطلوب إحضاره؟ من سيقابله؟",
    save: "إرسال الدعوة",
    saving: "جارٍ الحفظ...",
    saved: "تم إرسال دعوة المقابلة",
    rescheduled: "تم تحديث موعد المقابلة",
    needWhen: "اختر موعداً في المستقبل",
    minutes: (n: number) => `${n} دقيقة`,
    statusScheduled: "بانتظار تأكيد المرشح",
    statusConfirmed: "أكّد المرشح الحضور",
    statusDeclined: "اعتذر المرشح",
    statusCancelled: "ملغاة",
    statusCompleted: "تمت المقابلة",
    confirm: "تأكيد الحضور",
    decline: "الاعتذار",
    confirmed: "تم تأكيد حضورك",
    declined: "تم إبلاغ المنشأة باعتذارك",
    declineTitle: "الاعتذار عن المقابلة؟",
    declineDesc: "سيصل المنشأة إشعار باعتذارك، ويمكنها اقتراح موعد آخر.",
    declineCta: "نعم، اعتذر",
    cancel: "إلغاء المقابلة",
    cancelTitle: "إلغاء المقابلة؟",
    cancelDesc: "سيصل الطرف الآخر إشعار بالإلغاء.",
    cancelCta: "نعم، ألغِ",
    cancelled: "تم إلغاء المقابلة",
    complete: "إنهاء المقابلة وتقييمها",
    completeTitle: "نتيجة المقابلة",
    completeDesc: "سجّل تقييمك للمقابلة. التقييم داخلي لمنشأتك ولا يظهر للمرشح.",
    rating: "تقييم أداء المرشح في المقابلة",
    outcomeNote: "ملاحظات (اختياري)",
    outcomePh: "نقاط القوة، الملاحظات، التوصية...",
    rejectAfter: "نقل المرشح إلى «غير مُختار» بعد المقابلة",
    completeCta: "حفظ النتيجة",
    completed: "تم تسجيل نتيجة المقابلة",
    needRating: "اختر عدد النجوم أولاً",
    result: "نتيجة المقابلة",
    candidateNote: "ملاحظة المرشح",
    failed: "تعذّر تنفيذ العملية",
    joinLink: "رابط الاجتماع",
  },
  en: {
    interview: "Interview",
    schedule: "Schedule interview",
    reschedule: "Change time",
    scheduleTitle: (n: string) => `Schedule an interview with ${n}`,
    scheduleDesc: "Pick a time and format. The candidate is notified and can confirm or decline.",
    when: "Interview time",
    duration: "Duration (minutes)",
    mode: "Format",
    video: "Video call",
    phone: "Phone call",
    onsite: "On site",
    link: "Meeting link",
    place: "Address / location",
    notes: "Notes for the candidate (optional)",
    notesPh: "What to bring? Who will meet them?",
    save: "Send invitation",
    saving: "Saving...",
    saved: "Interview invitation sent",
    rescheduled: "Interview time updated",
    needWhen: "Pick a time in the future",
    minutes: (n: number) => `${n} min`,
    statusScheduled: "Awaiting candidate confirmation",
    statusConfirmed: "Candidate confirmed",
    statusDeclined: "Candidate declined",
    statusCancelled: "Cancelled",
    statusCompleted: "Completed",
    confirm: "Confirm attendance",
    decline: "Decline",
    confirmed: "Attendance confirmed",
    declined: "The facility has been notified",
    declineTitle: "Decline this interview?",
    declineDesc: "The facility is notified and may propose another time.",
    declineCta: "Yes, decline",
    cancel: "Cancel interview",
    cancelTitle: "Cancel this interview?",
    cancelDesc: "The other party will be notified.",
    cancelCta: "Yes, cancel",
    cancelled: "Interview cancelled",
    complete: "Finish & rate interview",
    completeTitle: "Interview outcome",
    completeDesc: "Record your rating. It stays internal to your facility.",
    rating: "Candidate performance",
    outcomeNote: "Notes (optional)",
    outcomePh: "Strengths, concerns, recommendation...",
    rejectAfter: "Move candidate to \u201cNot selected\u201d after this interview",
    completeCta: "Save outcome",
    completed: "Interview outcome saved",
    needRating: "Pick a star rating first",
    result: "Interview result",
    candidateNote: "Candidate note",
    failed: "The action could not be completed",
    joinLink: "Meeting link",
  },
} as const;

const ERRORS: Record<string, { ar: string; en: string }> = {
  INTERVIEW_TIME_PAST: { ar: "اختر موعداً في المستقبل.", en: "Pick a future time." },
  INTERVIEW_ALREADY_SCHEDULED: { ar: "يوجد موعد مقابلة قائم بالفعل.", en: "An interview is already scheduled." },
  NOT_FACILITY_OWNER: { ar: "هذه المقابلة ليست لمنشأتك.", en: "This interview is not yours." },
  NOT_CANDIDATE: { ar: "هذه المقابلة ليست لك.", en: "This interview is not yours." },
  INTERVIEW_NOT_PENDING: { ar: "لم يعد بالإمكان تعديل هذه المقابلة.", en: "This interview can no longer change." },
  INTERVIEW_COMPLETED: { ar: "المقابلة انتهت بالفعل.", en: "This interview is already completed." },
  INTERVIEW_RATING_INVALID: { ar: "اختر تقييماً من 1 إلى 5.", en: "Pick a rating from 1 to 5." },
  BOOKING_NOT_FOUND: { ar: "الحجز غير موجود أو ملغى.", en: "Booking not found or cancelled." },
  APPLICATION_NOT_FOUND: { ar: "الطلب غير موجود.", en: "Application not found." },
};

function errText(raw: string, lang: Lang) {
  const hit = Object.keys(ERRORS).find((k) => raw.includes(k));
  return hit ? ERRORS[hit]![lang] : TXT[lang].failed;
}

function statusLabel(status: string, lang: Lang) {
  const c = TXT[lang];
  return status === "confirmed"
    ? c.statusConfirmed
    : status === "declined"
      ? c.statusDeclined
      : status === "cancelled"
        ? c.statusCancelled
        : status === "completed"
          ? c.statusCompleted
          : c.statusScheduled;
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "phone") return <Phone className="size-4" />;
  if (mode === "onsite") return <MapPin className="size-4" />;
  return <Video className="size-4" />;
}

function modeLabel(mode: string, lang: Lang) {
  const c = TXT[lang];
  return mode === "phone" ? c.phone : mode === "onsite" ? c.onsite : c.video;
}

/** أقرب قيمة صالحة لحقل datetime-local (بتوقيت المتصفح). */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function useInterview(applicationId?: string, shiftBookingId?: string) {
  const target = { applicationId, shiftBookingId };
  const key = applicationId
    ? ["interview", "application", applicationId]
    : ["interview", "booking", shiftBookingId];
  return useQuery({
    queryKey: key,
    enabled: !!(applicationId || shiftBookingId),
    queryFn: async (): Promise<InterviewRow | null> => {
      let q = supabase.from("interviews").select(SELECT).order("created_at", { ascending: false }).limit(1);
      q = target.applicationId
        ? q.eq("application_id", target.applicationId)
        : q.eq("shift_booking_id", target.shiftBookingId!);
      const { data, error } = await q;
      if (error) throw error;
      return (data?.[0] as InterviewRow | undefined) ?? null;
    },
  });
}

function InterviewSummary({ row, lang }: { row: InterviewRow; lang: Lang }) {
  const c = TXT[lang];
  return (
    <div className="space-y-1 text-sm">
      <p className="flex flex-wrap items-center gap-2 font-bold">
        <CalendarClock className="size-4 text-primary" />
        {formatDateTime(row.scheduled_at, lang)}
        <span className="text-xs font-normal text-muted-foreground">{c.minutes(row.duration_minutes)}</span>
      </p>
      <p className="flex items-center gap-2 text-muted-foreground">
        <ModeIcon mode={row.mode} /> {modeLabel(row.mode, lang)}
        {row.mode === "onsite" && row.location ? ` · ${row.location}` : ""}
      </p>
      {row.mode !== "onsite" && row.meeting_url && (
        <a href={row.meeting_url} target="_blank" rel="noreferrer" className="block break-all text-primary underline">
          {c.joinLink}
        </a>
      )}
      {row.notes && <p className="whitespace-pre-line text-muted-foreground">{row.notes}</p>}
      {row.candidate_note && (
        <p className="text-muted-foreground">
          <span className="font-bold">{c.candidateNote}: </span>
          {row.candidate_note}
        </p>
      )}
    </div>
  );
}

/** لوحة المقابلة من جهة المنشأة: جدولة، إعادة جدولة، إلغاء، إنهاء وتقييم. */
export function FacilityInterviewBlock({
  applicationId,
  shiftBookingId,
  candidateName,
  disabled = false,
}: {
  applicationId?: string;
  shiftBookingId?: string;
  candidateName: string;
  disabled?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();
  const { data: row } = useInterview(applicationId, shiftBookingId);

  const [open, setOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState("30");
  const [mode, setMode] = useState("video");
  const [place, setPlace] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [outcomeNote, setOutcomeNote] = useState("");
  const [reject, setReject] = useState(false);

  const active = row && (row.status === "scheduled" || row.status === "confirmed");
  const isReschedule = !!row && (active || row.status === "declined");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["interview"] });
    queryClient.invalidateQueries({ queryKey: ["facility-applicants"] });
    queryClient.invalidateQueries({ queryKey: ["facility-shift-bookings"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const iso = new Date(when).toISOString();
      if (isReschedule && row) {
        const { error } = await supabase.rpc("reschedule_interview", {
          _interview_id: row.id,
          _scheduled_at: iso,
          ...(notes ? { _notes: notes } : {}),
        });
        if (error) throw error;
        return;
      }
      // الدالة تقبل أحد الهدفين فقط؛ الآخر يُرسل NULL.
      const { error } = await supabase.rpc("schedule_interview", {
        _application_id: (applicationId ?? null) as unknown as string,
        _shift_booking_id: (shiftBookingId ?? null) as unknown as string,
        _scheduled_at: iso,
        _duration_minutes: Math.min(Math.max(Number(duration) || 30, 10), 240),
        _mode: mode,
        ...(mode === "onsite" && place ? { _location: place } : {}),
        ...(mode !== "onsite" && link ? { _meeting_url: link } : {}),
        ...(notes ? { _notes: notes } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isReschedule ? c.rescheduled : c.saved);
      setOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(errText(e.message, lang)),
  });

  const cancelIv = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("cancel_interview", { _interview_id: row!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.cancelled);
      refresh();
    },
    onError: (e: Error) => toast.error(errText(e.message, lang)),
  });

  const complete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("complete_interview", {
        _interview_id: row!.id,
        _rating: rating,
        ...(outcomeNote ? { _note: outcomeNote } : {}),
        _reject: reject,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.completed);
      setCompleteOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(errText(e.message, lang)),
  });

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      {confirmDialog}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold">
          <CalendarClock className="size-4 text-primary" /> {c.interview}
          {row && <Badge variant={row.status === "confirmed" ? "secondary" : "outline"}>{statusLabel(row.status, lang)}</Badge>}
        </p>
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={active ? "outline" : "default"}
              onClick={() => {
                const base = new Date(Date.now() + 24 * 60 * 60 * 1000);
                base.setMinutes(0, 0, 0);
                setWhen(row && isReschedule ? toLocalInput(new Date(row.scheduled_at)) : toLocalInput(base));
                if (row) {
                  setDuration(String(row.duration_minutes));
                  setMode(row.mode);
                  setPlace(row.location ?? "");
                  setLink(row.meeting_url ?? "");
                  setNotes(row.notes ?? "");
                }
                setOpen(true);
              }}
            >
              <CalendarClock className="size-4" /> {isReschedule ? c.reschedule : c.schedule}
            </Button>
            {active && (
              <>
                <Button size="sm" variant="outline" onClick={() => setCompleteOpen(true)}>
                  <CheckCircle2 className="size-4" /> {c.complete}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cancelIv.isPending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: c.cancelTitle,
                      description: c.cancelDesc,
                      confirmLabel: c.cancelCta,
                      destructive: true,
                    });
                    if (ok) cancelIv.mutate();
                  }}
                >
                  <X className="size-4" /> {c.cancel}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {row && (
        <div className="mt-3">
          <InterviewSummary row={row} lang={lang} />
          {row.status === "completed" && (
            <p className="mt-2 text-sm">
              <span className="font-bold">{c.result}: </span>
              {"★".repeat(row.outcome_rating ?? 0)}
              {row.outcome_note ? ` — ${row.outcome_note}` : ""}
            </p>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{c.scheduleTitle(candidateName)}</DialogTitle>
            <DialogDescription>{c.scheduleDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="iv-when">{c.when}</Label>
              <Input id="iv-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            {!isReschedule && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="iv-dur">{c.duration}</Label>
                    <Input
                      id="iv-dur"
                      type="number"
                      min={10}
                      max={240}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{c.mode}</Label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">{c.video}</SelectItem>
                        <SelectItem value="phone">{c.phone}</SelectItem>
                        <SelectItem value="onsite">{c.onsite}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {mode === "onsite" ? (
                  <div>
                    <Label htmlFor="iv-place">{c.place}</Label>
                    <Input id="iv-place" value={place} onChange={(e) => setPlace(e.target.value)} />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="iv-link">{c.link}</Label>
                    <Input id="iv-link" dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} />
                  </div>
                )}
              </>
            )}
            <div>
              <Label htmlFor="iv-notes">{c.notes}</Label>
              <Textarea id="iv-notes" rows={3} placeholder={c.notesPh} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={save.isPending}
              onClick={() => {
                if (!when || new Date(when).getTime() <= Date.now()) {
                  toast.error(c.needWhen);
                  return;
                }
                save.mutate();
              }}
            >
              {save.isPending ? c.saving : c.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.completeTitle}</DialogTitle>
            <DialogDescription>{c.completeDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{c.rating}</Label>
              <div className="mt-2"><RatingInput value={rating} onChange={setRating} label={c.rating} /></div>
            </div>
            <div>
              <Label htmlFor="iv-out">{c.outcomeNote}</Label>
              <Textarea id="iv-out" rows={3} placeholder={c.outcomePh} value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} />
            </div>
            {applicationId && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[hsl(var(--primary))]"
                  checked={reject}
                  onChange={(e) => setReject(e.target.checked)}
                />
                {c.rejectAfter}
              </label>
            )}
          </div>
          <DialogFooter>
            <Button
              disabled={complete.isPending}
              onClick={() => {
                if (rating < 1) {
                  toast.error(c.needRating);
                  return;
                }
                complete.mutate();
              }}
            >
              {complete.isPending ? c.saving : c.completeCta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** بطاقة المقابلة من جهة المرشح: تأكيد الحضور أو الاعتذار. */
export function CandidateInterviewBlock({
  applicationId,
  shiftBookingId,
}: {
  applicationId?: string;
  shiftBookingId?: string;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();
  const { data: row } = useInterview(applicationId, shiftBookingId);

  const respond = useMutation({
    mutationFn: async (accept: boolean) => {
      const { error } = await supabase.rpc("respond_to_interview", {
        _interview_id: row!.id,
        _accept: accept,
      });
      if (error) throw error;
      return accept;
    },
    onSuccess: (accept) => {
      toast.success(accept ? c.confirmed : c.declined);
      queryClient.invalidateQueries({ queryKey: ["interview"] });
    },
    onError: (e: Error) => toast.error(errText(e.message, lang)),
  });

  if (!row || row.status === "cancelled") return null;

  const pending = row.status === "scheduled";

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      {confirmDialog}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold">
          <CalendarClock className="size-4 text-primary" /> {c.interview}
          <Badge variant={row.status === "confirmed" ? "secondary" : "outline"}>{statusLabel(row.status, lang)}</Badge>
        </p>
        {pending && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate(true)}>
              <CheckCircle2 className="size-4" /> {c.confirm}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={respond.isPending}
              onClick={async () => {
                const ok = await confirm({
                  title: c.declineTitle,
                  description: c.declineDesc,
                  confirmLabel: c.declineCta,
                  destructive: true,
                });
                if (ok) respond.mutate(false);
              }}
            >
              <X className="size-4" /> {c.decline}
            </Button>
          </div>
        )}
      </div>
      <div className="mt-3">
        <InterviewSummary row={row} lang={lang} />
      </div>
    </div>
  );
}
