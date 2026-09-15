import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, MessageSquare, Undo2, UserRound, Users as UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewDialog } from "@/components/review-dialog";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { FacilityInterviewBlock } from "@/components/interview";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import {
  APPLICATION_STAGES,
  applicationErrorText,
  applicationLabel,
  applicationStage,
  countryLabel,
  relativeTime,
} from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { ListSkeleton } from "@/components/list-skeleton";

/** Stages a facility can set manually. "hired" goes through the select-candidate button. */
const MANUAL_STAGES = ["submitted", "reviewing", "interview", "rejected"] as const;

const TXT = {
  ar: {
    title: "المتقدمون",
    back: "رجوع للوحة",
    healthcarePro: "كادر صحي",
    verified: "موثّق",
    experience: (n: number) => `خبرة ${n} سنة`,
    appliedFor: (title: string, time: string) => `تقدّم لوظيفة: ${title} · ${time}`,
    message: "مراسلة",
    updated: "تم تحديث مرحلة الطلب",
    chatOpened: "تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح",
    chatFailed: "تعذّر بدء المحادثة",
    empty: "لا يوجد متقدمون بعد.",
    emptyFiltered: "لا يوجد متقدمون في هذه المرحلة.",
    viewProfile: "الملف الكامل",
    loadFailed: "تعذّر تحميل طلبات هذه الوظيفة.",
    retry: "إعادة المحاولة",
    select: "اختيار هذا المرشح",
    selected: "مُختار",
    undo: "تراجع عن الاختيار",
    undone: "تم التراجع عن الاختيار",
    confirmTitle: "اختيار هذا المرشح؟",
    confirmDesc: (name: string, left: number) =>
      left <= 1
        ? `سيتم اختيار ${name}، وباكتمال الشواغر تُقفل الوظيفة تلقائياً ويصل بقية المتقدمين إشعار اعتذار.`
        : `سيتم اختيار ${name}. سيبقى ${left - 1} شاغر مفتوح للتقديم.`,
    confirmCta: "نعم، اختر هذا المرشح",
    undoTitle: "التراجع عن اختيار هذا المرشح؟",
    undoDesc: "سيعود الطلب لمرحلة المقابلة/العرض ويتحرر الشاغر.",
    undoCta: "نعم، تراجع",
    rejectTitle: "نقل الطلب إلى «غير مُختار»؟",
    rejectDesc: "سيصل المتقدم إشعار بأنه لم يقع عليه الاختيار. يمكنك تغيير المرحلة لاحقاً.",
    rejectCta: "نعم، انقله",
    closedJob: "اكتملت الشواغر — الوظيفة مقفلة",
    filled: (h: number, v: number) => `تم اختيار ${h} من ${v}`,
    counts: (t: number) => `${t} متقدم`,
    filterAll: "كل المراحل",
    stageFilter: "المرحلة",
    revealTitle: "بدء المحادثة مع المرشح؟",
    revealDesc: "عند بدء المحادثة سيظهر اسم منشأتك لهذا المرشح حتى تكون المحادثة واضحة للطرفين.",
    revealCta: "ابدأ المحادثة",
  },
  en: {
    title: "Applicants",
    back: "Back to dashboard",
    healthcarePro: "Healthcare professional",
    verified: "Verified",
    experience: (n: number) => `${n} years experience`,
    appliedFor: (title: string, time: string) => `Applied for: ${title} · ${time}`,
    message: "Message",
    updated: "Application stage updated",
    chatOpened: "Conversation opened — your facility name is now visible to the candidate",
    chatFailed: "Failed to start conversation",
    empty: "No applicants yet.",
    emptyFiltered: "No applicants in this stage.",
    viewProfile: "Full profile",
    loadFailed: "We couldn't load applications for this job.",
    retry: "Try again",
    select: "Select this candidate",
    selected: "Selected",
    undo: "Undo selection",
    undone: "Selection undone",
    confirmTitle: "Select this candidate?",
    confirmDesc: (name: string, left: number) =>
      left <= 1
        ? `${name} will be selected. All positions are then filled, the job closes and the remaining applicants are notified.`
        : `${name} will be selected. ${left - 1} position(s) stay open.`,
    confirmCta: "Yes, select",
    undoTitle: "Undo this selection?",
    undoDesc: "The application goes back to interview/offer and the position reopens.",
    undoCta: "Yes, undo",
    rejectTitle: "Move to \u201cNot selected\u201d?",
    rejectDesc: "The applicant will be notified. You can change the stage later.",
    rejectCta: "Yes, move",
    closedJob: "All positions filled — job closed",
    filled: (h: number, v: number) => `${h} of ${v} selected`,
    counts: (t: number) => `${t} applicant(s)`,
    filterAll: "All stages",
    stageFilter: "Stage",
    revealTitle: "Start a conversation with this candidate?",
    revealDesc: "Starting the conversation reveals your facility name to this candidate so both sides know who they are speaking with.",
    revealCta: "Start conversation",
  },
} as const;

export function FacilityApplicantsPanel({ jobId, embedded = false }: { jobId?: string; embedded?: boolean } = {}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const { confirm, confirmDialog } = useConfirm();
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["facility-applicants", user?.id, jobId ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data: facility, error: facilityError } = await supabase
        .from("facilities")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (facilityError) throw facilityError;
      if (!facility) return null;
      const facilityId = facility.id;
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id,title,vacancies,is_active")
        .eq("facility_id", facility.id);
      if (jobsError) throw jobsError;
      const ids = (jobs ?? []).map((j) => j.id).filter((id) => !jobId || id === jobId);
      if (ids.length === 0) return { facilityId, rows: [], job: null };
      const { data: apps, error } = await supabase
        .from("applications")
        .select("id,status,created_at,cover_letter,user_id,job_id")
        .in("job_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((apps ?? []).map((a) => a.user_id)));
      const { data: pros, error: prosError } = await supabase
        .from("healthcare_professionals")
        .select("user_id,full_name,headline,years_experience,country,city,is_verified")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      if (prosError) throw prosError;

      return {
        facilityId,
        job: jobId ? (jobs ?? []).find((j) => j.id === jobId) ?? null : null,
        rows: (apps ?? []).map((a) => ({
          ...a,
          facilityId,
          job: jobs?.find((j) => j.id === a.job_id) ?? null,
          pro: pros?.find((p) => p.user_id === a.user_id) ?? null,
        })),
      };
    },
  });

  const rows = data?.rows ?? [];
  const job = data?.job ?? null;

  const hiredCount = useMemo(() => rows.filter((r) => r.status === "hired").length, [rows]);
  const vacancies = Math.max(job?.vacancies ?? 1, 1);
  const jobOpen = job ? job.is_active : true;
  const seatsLeft = Math.max(vacancies - hiredCount, 0);

  const visible = useMemo(
    () => (stageFilter === "all" ? rows : rows.filter((r) => applicationStage(r.status) === stageFilter)),
    [rows, stageFilter],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["facility-applicants"] });
    queryClient.invalidateQueries({ queryKey: ["facility-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["facility-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["job"] });
  };

  const setStage = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.rpc("set_application_stage", {
        _application_id: id,
        _status: status as "reviewing",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.updated);
      invalidate();
    },
    onError: (e: Error) => toast.error(applicationErrorText(e.message, lang)),
  });

  const hire = useMutation({
    mutationFn: async (id: string) => {
      const { data: res, error } = await supabase.rpc("hire_applicant", { _application_id: id });
      if (error) throw error;
      return res as { hired: number; vacancies: number; closed: boolean };
    },
    onSuccess: (res) => {
      toast.success(res?.closed ? c.closedJob : c.filled(res.hired, res.vacancies));
      invalidate();
    },
    onError: (e: Error) => toast.error(applicationErrorText(e.message, lang)),
  });

  const unhire = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("unhire_applicant", { _application_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.undone);
      invalidate();
    },
    onError: (e: Error) => toast.error(applicationErrorText(e.message, lang)),
  });

  const busyId =
    (setStage.isPending ? setStage.variables?.id : null) ??
    (hire.isPending ? hire.variables : null) ??
    (unhire.isPending ? unhire.variables : null);

  const startChat = useMutation({
    mutationFn: async ({ candidateUserId, jobId }: { candidateUserId: string; jobId: string }) => {
      const { error } = await supabase.rpc("start_candidate_conversation", {
        _professional_user_id: candidateUserId,
        _job_id: jobId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.chatOpened);
      navigate({ to: "/messages" });
    },
    onError: () => toast.error(c.chatFailed),
  });

  return (
    <div className={embedded ? "" : "mx-auto max-w-5xl"}>
      {confirmDialog}

      {!embedded && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{c.title}</h1>
          <Link to="/facility" className="text-sm text-primary underline">{c.back}</Link>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="mt-4 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
          <Badge variant="outline">{c.counts(rows.length)}</Badge>
          {job && <Badge variant="secondary">{c.filled(hiredCount, vacancies)}</Badge>}
          {job && !jobOpen && (
            <Badge className="gap-1 bg-muted text-foreground">
              <CheckCircle2 className="size-3.5" /> {c.closedJob}
            </Badge>
          )}
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="col-span-2 w-full sm:w-48" aria-label={c.stageFilter}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{c.filterAll}</SelectItem>
              {[...APPLICATION_STAGES, "rejected"].map((s) => (
                <SelectItem key={s} value={s}>{applicationLabel(s, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState className="mt-6" icon={AlertCircle} title={c.loadFailed} action={<Button variant="outline" onClick={() => void refetch()}>{c.retry}</Button>} />
      ) : visible.length ? (
        <ul className="mt-6 space-y-4">
          {visible.map((a) => {
            const stage = applicationStage(a.status);
            const isHired = stage === "hired";
            const rowBusy = busyId === a.id;
            const canSelect = jobOpen && !isHired && seatsLeft > 0 && !!job;
            return (
              <li key={a.id} className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {a.pro?.full_name ?? c.healthcarePro}
                      {a.pro?.is_verified && <Badge className="ms-2" variant="secondary">{c.verified}</Badge>}
                      {isHired && (
                        <Badge className="ms-2 gap-1 bg-success text-success-foreground">
                          <CheckCircle2 className="size-3.5" /> {c.selected}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.pro?.headline ?? "—"} · {c.experience(a.pro?.years_experience ?? 0)} ·{" "}
                      {[a.pro?.city, countryLabel(a.pro?.country, lang)].filter(Boolean).join("، ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.appliedFor(a.job?.title ?? "", relativeTime(a.created_at, lang))}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const ok = await confirm({
                          title: c.revealTitle,
                          description: c.revealDesc,
                          confirmLabel: c.revealCta,
                        });
                        if (ok) startChat.mutate({ candidateUserId: a.user_id, jobId: a.job_id });
                      }}
                      loading={startChat.isPending}
                    >
                      <MessageSquare className="size-4" /> {c.message}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/facility/candidates/$userId" params={{ userId: a.user_id }}>
                        <UserRound className="size-4" /> {c.viewProfile}
                      </Link>
                    </Button>

                    {canSelect && (
                      <Button
                        size="sm"
                        disabled={rowBusy}
                        onClick={async () => {
                          const ok = await confirm({
                            title: c.confirmTitle,
                            description: c.confirmDesc(a.pro?.full_name ?? c.healthcarePro, seatsLeft),
                            confirmLabel: c.confirmCta,
                          });
                          if (!ok) return;
                          hire.mutate(a.id);
                        }}
                      >
                        <CheckCircle2 className="size-4" /> {c.select}
                      </Button>
                    )}

                    {isHired && jobOpen && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rowBusy}
                        onClick={async () => {
                          const ok = await confirm({
                            title: c.undoTitle,
                            description: c.undoDesc,
                            confirmLabel: c.undoCta,
                            destructive: true,
                          });
                          if (!ok) return;
                          unhire.mutate(a.id);
                        }}
                      >
                        <Undo2 className="size-4" /> {c.undo}
                      </Button>
                    )}

                    {isHired && user && (
                      <ReviewDialog
                        direction="facility_to_pro"
                        facilityId={a.facilityId}
                        professionalUserId={a.user_id}
                        authorUserId={user.id}
                        targetName={a.pro?.full_name ?? c.healthcarePro}
                        jobId={a.job_id}
                      />
                    )}

                    {!isHired && jobOpen && (
                      <Select
                        value={stage}
                        disabled={rowBusy}
                        onValueChange={async (v) => {
                          if (v === stage) return;
                          if (v === "rejected") {
                            const ok = await confirm({
                              title: c.rejectTitle,
                              description: c.rejectDesc,
                              confirmLabel: c.rejectCta,
                              destructive: true,
                            });
                            if (!ok) return;
                          }
                          setStage.mutate({ id: a.id, status: v });
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MANUAL_STAGES.map((k) => (
                            <SelectItem key={k} value={k}>{applicationLabel(k, lang)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {!isHired && !jobOpen && (
                      <Badge variant="outline">{applicationLabel(a.status, lang)}</Badge>
                    )}
                  </div>
                </div>
                {applicationStage(a.status) !== "submitted" && (
                  <FacilityInterviewBlock
                    applicationId={a.id}
                    candidateName={a.pro?.full_name ?? c.healthcarePro}
                    disabled={stage === "rejected"}
                  />
                )}
                {a.cover_letter && (
                    <p className="mt-4 rounded-lg bg-surface p-4 text-sm leading-relaxed whitespace-pre-line">
                    {a.cover_letter}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState className="mt-6" icon={UsersIcon} title={rows.length ? c.emptyFiltered : c.empty} />
      )}
    </div>
  );
}
