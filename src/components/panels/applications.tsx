import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { engagementErrorText } from "@/lib/engagement-errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ReviewDialog } from "@/components/review-dialog";
import { CandidateInterviewBlock } from "@/components/interview";
import { AlertCircle, Briefcase, CheckCircle2, Clock, FileText, Undo2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { APPLICATION_STAGES, applicationLabel, applicationStage, facilityDisplayName, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { employerText, useInactiveEmployers } from "@/lib/employer";
import { ListSkeleton } from "@/components/list-skeleton";


const STAGES = [...APPLICATION_STAGES];

const TXT = {
  ar: {
    title: "طلباتي",
    sub: "كل طلب ومرحلته الحالية لدى المنشأة.",
    appliedAt: (t: string) => `قُدّم ${t}`,
    empty: "لا طلبات بعد.",
    browseJobs: "تصفح الوظائف",
    employer: "المنشأة",
    stageOf: (name: string, i: number, n: number) => `المرحلة الحالية: ${name} (${i} من ${n})`,
    error: "تعذّر تحميل طلباتك.",
    retry: "إعادة المحاولة",
    withdraw: "سحب الطلب",
    withdrawTitle: "سحب هذا الطلب؟",
    withdrawDesc: "سيظهر طلبك لدى المنشأة كـ«طلب مسحوب»، وتُلغى أي مقابلة مرتبطة به. يبقى الطلب في سجلك، ويمكنك التقديم من جديد ما دامت الوظيفة مفتوحة.",
    reasonLabel: "سبب السحب (اختياري)",
    reasonPlaceholder: "مثال: ارتبطت بفرصة أخرى.",
    cancel: "إلغاء",
    confirmWithdraw: "نعم، اسحب الطلب",
    withdrawn: "تم سحب الطلب",
    withdrawnAt: (t: string) => `سُحب ${t}`,
    reapply: "التقديم من جديد",
    updatedAfter: (t: string) => `حُدّثت تفاصيل الوظيفة بعد تقديمك (${t})`,
  },
  en: {
    title: "My applications",
    sub: "Every application and its current stage with the employer.",
    appliedAt: (t: string) => `Applied ${t}`,
    empty: "No applications yet.",
    browseJobs: "Browse jobs",
    employer: "the employer",
    stageOf: (name: string, i: number, n: number) => `Current stage: ${name} (${i} of ${n})`,
    error: "We couldn't load your applications.",
    retry: "Try again",
    withdraw: "Withdraw application",
    withdrawTitle: "Withdraw this application?",
    withdrawDesc: "The employer will see it as withdrawn and any linked interview is cancelled. It stays in your history, and you can apply again while the job is open.",
    reasonLabel: "Reason (optional)",
    reasonPlaceholder: "e.g. I accepted another offer.",
    cancel: "Cancel",
    confirmWithdraw: "Yes, withdraw",
    withdrawn: "Application withdrawn",
    withdrawnAt: (t: string) => `Withdrawn ${t}`,
    reapply: "Apply again",
    updatedAfter: (t: string) => `Job details were updated after you applied (${t})`,
  },
} as const;

export function ApplicationsPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const inactiveEmployers = useInactiveEmployers();
  const emp = employerText(lang);
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<{ id: string } | null>(null);
  const [reason, setReason] = useState("");

  const withdraw = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const args: { _application_id: string; _reason?: string } = { _application_id: id };
      if (reason.trim()) args._reason = reason.trim().slice(0, 500);
      const { error } = await supabase.rpc("withdraw_job_application", args);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.withdrawn);
      setTarget(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["my-apps-full"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
    onError: (e: Error) => toast.error(engagementErrorText(e.message, lang)),
  });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-apps-full", user?.id, lang],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,created_at,withdrawn_at,cover_letter,jobs(id,title,city,country,facility_id,is_active,expires_at)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const facilityIds = Array.from(new Set((data ?? []).map((a) => a.jobs?.facility_id).filter(Boolean) as string[]));
      const { data: facs } = facilityIds.length
        ? await supabase.from("facilities").select("id,name_ar,name_en").in("id", facilityIds)
        : { data: [] as { id: string; name_ar: string; name_en: string | null }[] };
      // Phase 93: تعديلات الوظيفة الجوهرية بعد التقديم مُسجّلة، فنُظهر إشعاراً للمتقدم.
      const jobIds = Array.from(new Set((data ?? []).map((a) => a.jobs?.id).filter(Boolean) as string[]));
      const { data: changes } = jobIds.length
        ? await supabase
            .from("job_change_events")
            .select("job_id,created_at")
            .in("job_id", jobIds)
            .order("created_at", { ascending: false })
        : { data: [] as { job_id: string; created_at: string }[] };
      return (data ?? []).map((a) => ({
        ...a,
        facilityName: (() => {
          const f = facs?.find((x) => x.id === a.jobs?.facility_id);
          return f ? facilityDisplayName(f, lang) : null;
        })(),
        updatedAfterApply:
          changes?.find((ch) => ch.job_id === a.jobs?.id && ch.created_at > a.created_at)?.created_at ?? null,
      }));
    },
  });

  return (
    <div>
      <Dialog open={!!target} onOpenChange={(o) => { if (!o) setTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.withdrawTitle}</DialogTitle>
            <DialogDescription>{c.withdrawDesc}</DialogDescription>
          </DialogHeader>
          <label htmlFor="withdraw-reason" className="text-sm font-medium">{c.reasonLabel}</label>
          <Textarea
            id="withdraw-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={c.reasonPlaceholder}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>{c.cancel}</Button>
            <Button
              variant="destructive"
              loading={withdraw.isPending}
              onClick={() => target && withdraw.mutate({ id: target.id, reason })}
            >
              {c.confirmWithdraw}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState className="mt-6" icon={AlertCircle} title={c.error} action={<Button variant="outline" onClick={() => void refetch()}>{c.retry}</Button>} />
      ) : data?.length ? (
        <ul className="space-y-3">
          {data.map((a) => {
            const idx = STAGES.indexOf(applicationStage(a.status) as (typeof STAGES)[number]);
            const rejected = a.status === "rejected";
            const withdrawn = a.status === "withdrawn";
            const canWithdraw = !withdrawn && !rejected && a.status !== "hired";
            const employerGone = !!a.jobs?.facility_id && inactiveEmployers.has(a.jobs.facility_id);
            return (
              <li key={a.id} className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Briefcase className="size-5" />
                    </span>
                    <div className="min-w-0">
                      {employerGone ? (
                        <p className="truncate font-bold">{a.jobs?.title}</p>
                      ) : (
                        <Link to="/jobs/$jobId" params={{ jobId: a.jobs!.id }} className="block truncate font-bold hover:text-primary">
                          {a.jobs?.title}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {a.jobs?.city} · {c.appliedAt(relativeTime(a.created_at, lang))}
                      </p>
                      {a.updatedAfterApply && !withdrawn && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.updatedAfter(relativeTime(a.updatedAfterApply, lang))}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                    {a.status === "hired" && user && a.jobs?.facility_id && !employerGone && (
                      <ReviewDialog
                        direction="pro_to_facility"
                        facilityId={a.jobs.facility_id}
                        professionalUserId={user.id}
                        authorUserId={user.id}
                        targetName={a.facilityName ?? c.employer}
                        jobId={a.jobs.id}
                      />
                    )}
                    <Badge variant={rejected ? "destructive" : "secondary"} className="gap-1">
                      {rejected ? <XCircle className="size-3.5" /> : withdrawn ? <Undo2 className="size-3.5" /> : a.status === "hired" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                      {applicationLabel(a.status, lang)}
                    </Badge>
                  </div>
                </div>
                {employerGone ? (
                  <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">{emp.unavailable}</span> — {emp.unavailableNote}
                  </p>
                ) : withdrawn ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                    <span>{a.withdrawn_at ? c.withdrawnAt(relativeTime(a.withdrawn_at, lang)) : c.withdrawn}</span>
                    {a.jobs?.is_active &&
                      (!a.jobs.expires_at || new Date(a.jobs.expires_at).getTime() > Date.now()) && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/jobs/$jobId" params={{ jobId: a.jobs.id }}>{c.reapply}</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <CandidateInterviewBlock applicationId={a.id} />
                )}
                {canWithdraw && !employerGone && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { setReason(""); setTarget({ id: a.id }); }}
                    >
                      <Undo2 className="size-4" /> {c.withdraw}
                    </Button>
                  </div>
                )}
                {!rejected && !withdrawn && (
                  <div className="mt-4">
                    <div className="flex gap-1" aria-hidden="true">
                      {STAGES.map((s, i) => (
                        <span
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex gap-1 text-[11px]">
                      {STAGES.map((s, i) => (
                        <span
                          key={s}
                          className={`flex-1 text-center ${i === idx ? "font-bold text-foreground" : "text-muted-foreground"}`}
                        >
                          {applicationLabel(s, lang)}
                        </span>
                      ))}
                    </div>
                    <span className="sr-only">
                      {c.stageOf(applicationLabel(STAGES[Math.max(idx, 0)]!, lang), idx + 1, STAGES.length)}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          className="mt-6"
          icon={FileText}
          title={c.empty}
          action={
            <Button asChild>
              <Link to="/jobs">{c.browseJobs}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
