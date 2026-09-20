import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FacilityApplicantsPanel } from "@/components/panels/facility.applicants";
import { FacilityBookingsPanel } from "@/components/panels/facility.bookings";
import { InvitePanel } from "@/components/panels/invite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  Eye,
  MessageSquare,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Users,
  UserPlus,
  MoreHorizontal,
  PauseCircle,
  CheckCircle2,
  CircleSlash,
  Layers,
  ClipboardList,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import { StepIndicator } from "@/components/step-indicator";
import { EmptyState } from "@/components/empty-state";
import { RemoteAvatar } from "@/components/remote-avatar";
import { PublishedWorkCard, WorkCountButton } from "@/components/work-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hasIdentityDisclosure } from "@/lib/listing-privacy";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { assertOk } from "@/lib/query-errors";
import { useSession } from "@/lib/auth";
import { Combobox, comboText } from "@/components/ui/combobox";
import { cityOptions, countryOptions, currencyOptions } from "@/lib/geo";
import {
  countryLabel,
  employmentLabel,
  formatDateTime,
  formatMoney,
  formatSalary,
  specialtyName,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useUnread } from "@/lib/unread";
import { NextStepCard, QuickAction, SectionHeading, WorkspaceHeading } from "@/components/workspace-ui";
import { Skeleton } from "@/components/ui/skeleton";

import { TXT, shiftErrorText, type FacilitySearch, type PlanRow, type SubRow } from "@/components/panels/facility.shared";
import { ErrorState } from "@/components/error-state";
import { friendlyError, userError } from "@/lib/user-errors";

export const Route = createFileRoute("/_authenticated/facility/")({
  validateSearch: (search: Record<string, unknown>): FacilitySearch => {
    const tab = search["tab"];
    return typeof tab === "string" ? { tab } : {};
  },
  head: () => ({
    meta: [
      { title: "لوحة المنشأة | SyndeoCare" },
      { name: "description", content: "أعمالك المنشورة والمتقدمون والحجوزات وتوثيق المنشأة في مكان واحد." },
      { property: "og:title", content: "لوحة المنشأة | SyndeoCare" },
      { property: "og:description", content: "إدارة الوظائف والمناوبات والمتقدمين." },
    ],
  }),
  component: FacilityDashboard,
});

function FacilityDashboard() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { confirm, confirmDialog } = useConfirm();
  const rawTab = Route.useSearch().tab ?? "all";
  // توافق خلفي: الروابط القديمة new-job/new-shift تفتح القسم الصحيح مع نافذة الإنشاء.
  const legacyCreate = rawTab === "new-job" ? "job" : rawTab === "new-shift" ? "shift" : null;
  const tab = rawTab === "new-job" ? "jobs" : rawTab === "new-shift" ? "shifts" : rawTab;
  const navigate = useNavigate();
  const [openApplicants, setOpenApplicants] = useState<string | null>(null);
  const [openBookings, setOpenBookings] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<"job" | "shift" | null>(legacyCreate);
  type WorkRef = { kind: "job" | "shift"; id: string };
  const [justPublished, setJustPublished] = useState<WorkRef | null>(null);
  const [inviteTarget, setInviteTarget] = useState<WorkRef | null>(null);

  const { user } = useSession();
  const { total: unreadMessages } = useUnread(user);
  const queryClient = useQueryClient();

  const facilityQuery = useQuery({
    queryKey: ["my-facility", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: facility, isLoading } = facilityQuery;

  const { data: specialties, isError: specialtiesErr, refetch: specialtiesRefetch } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: jobs, isError: jobsErr, refetch: jobsRefetch } = useQuery({
    queryKey: ["facility-jobs", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*,applications(id,status)")
        .eq("facility_id", facility!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: shifts, isError: shiftsErr, refetch: shiftsRefetch } = useQuery({
    queryKey: ["facility-shifts", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*,shift_bookings(id,status)")
        .eq("facility_id", facility!.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sub, isError: subErr, refetch: subRefetch } = useQuery({
    queryKey: ["facility-sub", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facility_subscriptions")
        .select("*,subscription_plans(*)")
        .eq("facility_id", facility!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SubRow | null;
    },
  });

  const plan = sub?.subscription_plans ?? null;
  const subActive =
    !!sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    (!sub.ends_at || new Date(sub.ends_at) > new Date());
  const activeJobs = (jobs ?? []).filter((j) => j.is_active).length;
  const activeShifts = (shifts ?? []).filter((s) => s.status === "open").length;
  const newApplicants = (jobs ?? []).reduce(
    (count, job) => count + (job.applications ?? []).filter((application) => application.status === "submitted").length,
    0,
  );
  const overdueShifts = (shifts ?? []).filter(
    (shift) => shift.status === "booked" && new Date(shift.ends_at).getTime() <= Date.now(),
  ).length;
  const searchesRemaining = plan
    ? Math.max(plan.candidate_searches - (sub?.searches_used ?? 0), 0)
    : null;

  const toggleJob = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("jobs").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["facility-jobs"] }),
  });

  const cancelShift = useMutation({
    mutationFn: async (id: string) => {
      // إلغاء موثوق: يلغي الحجز ويُخطر المختص في عملية واحدة بدل تحديث الحالة مباشرة.
      const { error } = await supabase.rpc("cancel_facility_shift", { _shift_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.shiftCancelled);
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["facility-shift-bookings"] });
    },
    onError: (e: Error) => toast.error(shiftErrorText(e.message, lang)),
  });

  const completeShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("complete_shift", { _shift_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم إنهاء المناوبة" : "Shift completed");
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e: Error) => toast.error(shiftErrorText(e.message, lang)),
  });

  const loadErrors = [
    { err: specialtiesErr, retry: specialtiesRefetch },
    { err: jobsErr, retry: jobsRefetch },
    { err: shiftsErr, retry: shiftsRefetch },
    { err: subErr, retry: subRefetch },
  ].filter((q) => q.err);
  if (loadErrors.length > 0)
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ErrorState
          onRetry={() => {
            for (const q of loadErrors) void q.retry();
          }}
        />
      </div>
    );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8" aria-label={c.loading}>
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }
  if (facilityQuery.isError) {
    return (
      <EmptyState
        className="mx-auto mt-10 max-w-2xl"
        icon={ShieldAlert}
        title={c.loadFailed}
        action={<Button variant="outline" onClick={() => void facilityQuery.refetch()}>{c.retry}</Button>}
      />
    );
  }
  if (!facility) return <FacilityForm />;

  const publishMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full min-h-11 sm:w-auto">
          <PlusCircle className="size-4" /> {lang === "ar" ? "نشر" : "Create"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          className="min-h-11 gap-2"
          onSelect={() => {
            setCreateMode("job");
            void navigate({ to: "/facility", search: { tab: "jobs" }, replace: true });
          }}
        >
          <Briefcase className="size-4" /> {c.tabNewJob}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 gap-2"
          onSelect={() => {
            setCreateMode("shift");
            void navigate({ to: "/facility", search: { tab: "shifts" }, replace: true });
          }}
        >
          <CalendarClock className="size-4" /> {c.tabNewShift}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );


  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {confirmDialog}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <RemoteAvatar
            value={facility.logo_url}
            alt={facility.name_ar}
            icon={Building2}
            className="size-11 shrink-0 sm:size-12"
          />

          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{c.workspace}</p>
            <h1 className="mt-0.5 flex items-center gap-2 text-xl font-bold sm:text-3xl">
              <span className="truncate">{facility.name_ar}</span>
              {facility.is_verified && <BadgeCheck className="size-5 shrink-0 text-primary sm:size-6" />}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {facility.city}، {countryLabel(facility.country, lang)}
              {facility.is_verified ? c.verified : c.unverified}
            </p>
          </div>
        </div>
        <div className="shrink-0">{publishMenu}</div>
      </div>

      <Dialog
        open={createMode !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCreateMode(null);
            setJustPublished(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {justPublished ? c.publishedTitle : createMode === "shift" ? c.tabNewShift : c.tabNewJob}
            </DialogTitle>
          </DialogHeader>
          {justPublished ? (
            <div className="space-y-4 py-2 text-center">
               <CheckCircle2 className="mx-auto size-12 text-success" />
              <p className="text-sm text-muted-foreground">
                {justPublished.kind === "shift" ? c.publishedSubShift : c.publishedSubJob}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => {
                    setInviteTarget(justPublished);
                    setJustPublished(null);
                    setCreateMode(null);
                  }}
                >
                  <UserPlus className="size-4" /> {c.inviteNow}
                </Button>
                {justPublished.kind === "job" ? (
                  <Button variant="outline" asChild>
                    <Link to="/jobs/$jobId" params={{ jobId: justPublished.id }}>{c.viewPublished}</Link>
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link to="/shifts/$shiftId" params={{ shiftId: justPublished.id }}>{c.viewPublished}</Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {createMode === "job" && (
                <JobForm
                  facilityId={facility.id}
                  facilityNames={[facility.name_ar, facility.name_en]}
                  specialties={specialties ?? []}
                  defaults={{ country: facility.country, city: facility.city }}
                  quotaReached={!!plan && activeJobs >= plan.active_jobs}
                  expired={!!sub && !subActive}
                  onCreated={(id) => setJustPublished({ kind: "job", id })}
                />
              )}
              {createMode === "shift" && (
                <ShiftForm
                  facilityId={facility.id}
                  facilityNames={[facility.name_ar, facility.name_en]}
                  specialties={specialties ?? []}
                  defaults={{ country: facility.country, city: facility.city }}
                  quotaReached={!!plan && activeShifts >= plan.active_shifts}
                  expired={!!sub && !subActive}
                  onCreated={(id) => setJustPublished({ kind: "shift", id })}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={inviteTarget !== null} onOpenChange={(o) => !o && setInviteTarget(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{c.inviteDialogTitle}</DialogTitle>
          </DialogHeader>
          {inviteTarget && (
            <InvitePanel
              jobId={inviteTarget.kind === "job" ? inviteTarget.id : undefined}
              shiftId={inviteTarget.kind === "shift" ? inviteTarget.id : undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      {(!facility.is_verified || overdueShifts > 0 || newApplicants > 0) && (
        <div className="mt-6">
          {!facility.is_verified ? (
            <NextStepCard
              icon={ShieldAlert}
              label={c.attention}
              title={c.verifyNow}
              description={c.verifyBody}
              tone="warning"
              action={<Button variant="secondary" asChild><Link to="/facility/profile" search={{ tab: "verification" }}>{c.verifyNow}</Link></Button>}
            />
          ) : overdueShifts > 0 ? (
            <NextStepCard
              icon={CalendarClock}
              label={c.attention}
              title={c.overdueTitle(overdueShifts)}
              description={c.overdueBody}
              tone="warning"
              action={<Button variant="secondary" onClick={() => void navigate({ to: "/facility", search: { tab: "shifts" }, replace: true })}>{c.reviewShifts}</Button>}
            />
          ) : (
            <NextStepCard
              icon={Users}
              label={c.attention}
              title={c.applicantsTitle(newApplicants)}
              description={c.applicantsBody}
              tone="accent"
              action={<Button variant="secondary" onClick={() => void navigate({ to: "/facility", search: { tab: "jobs" }, replace: true })}>{c.reviewWork}</Button>}
            />
          )}
        </div>
      )}

      <section className="mt-8">
        <SectionHeading title={c.quickActions} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction icon={ClipboardList} label={c.createWork} description={c.createWorkText} onClick={() => setCreateMode("job")} />
          <QuickAction icon={Users} label={c.candidates} description={c.candidatesText} to="/facility/candidates" />
          <QuickAction icon={MessageSquare} label={c.unreadMessages} description={c.messagesText} to="/messages" />
          <QuickAction icon={Settings} label={c.facilityProfile} description={c.facilityProfileText} to="/facility/profile" />
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric icon={Users} value={newApplicants} label={c.newApplicants} />
        <DashboardMetric icon={MessageSquare} value={unreadMessages} label={c.unreadMessages} />
        <DashboardMetric icon={Briefcase} value={activeJobs} label={c.activeJobs} />
        <DashboardMetric icon={CalendarClock} value={activeShifts} label={c.openShifts} />
      </div>

      {plan && (
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-bold">
              <Sparkles className="size-5 shrink-0 text-primary" />
              {c.trialUsage}
              {plan.is_trial && <Badge variant="secondary">{c.trial}</Badge>}
              {!subActive && <Badge variant="destructive">{c.expired}</Badge>}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {sub?.ends_at ? c.endsAt(formatDateTime(sub.ends_at, lang)) : c.activeSub}{" "}
               · {c.activeJobsCount(activeJobs, plan.active_jobs)} · {c.activeShiftsCount(activeShifts, plan.active_shifts)}
               {searchesRemaining !== null ? ` · ${c.searchesRemaining(searchesRemaining)}` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="mt-10">
        <SectionHeading title={c.publishedWork} />
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.overview}</p>
      </div>
      <div className="mt-4 -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex items-center gap-1 rounded-lg bg-surface p-1" role="tablist">
          {(
            [
              ["all", c.tabAll((jobs?.length ?? 0) + (shifts?.length ?? 0)), Layers],
              ["jobs", c.tabJobs(jobs?.length ?? 0), Briefcase],
              ["shifts", c.tabShifts(shifts?.length ?? 0), CalendarClock],
            ] as [string, string, typeof Briefcase][]
          ).map(([key, label, Icon]) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={tab === key}
              onClick={() => void navigate({ to: "/facility", search: { tab: key }, replace: true })}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

        <div className={cn("mt-6 space-y-3", tab === "shifts" && "hidden")}>
          {jobs?.length ? (
            jobs.map((j) => {
              const applicants = j.applications?.length ?? 0;
              return (
                <PublishedWorkCard
                  key={j.id}
                  type="job"
                  title={j.title}
                  to="/jobs/$jobId"
                  params={{ jobId: j.slug ?? j.id }}
                  status={j.is_active ? "published" : "closed"}
                  meta={
                    <>
                      {formatSalary(Number(j.salary_min), Number(j.salary_max), j.currency, lang)} ·{" "}
                      {employmentLabel(j.employment_type, lang)} · {j.city}
                    </>
                  }
                  actions={
                    <>
                      <WorkCountButton
                        type="job"
                        count={applicants}
                        expanded={openApplicants === j.id}
                        onToggle={() => setOpenApplicants((v) => (v === j.id ? null : j.id))}
                      />
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/jobs/$jobId" params={{ jobId: j.slug ?? j.id }}>
                          <Eye className="size-4" /> {c.view}
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="size-11 p-0" aria-label={c.moreActions}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {j.is_active && (
                            <DropdownMenuItem
                              className="min-h-11 gap-2"
                              onSelect={() => setInviteTarget({ kind: "job", id: j.id })}
                            >
                              <UserPlus className="size-4" /> {c.invite}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="min-h-11 gap-2"
                            disabled={toggleJob.isPending}
                            onSelect={async () => {
                              if (j.is_active) {
                                const ok = await confirm({
                                  title: c.confirmCloseTitle,
                                  description: c.confirmCloseDesc,
                                  confirmLabel: c.confirmCloseCta,
                                  destructive: true,
                                });
                                if (!ok) return;
                              }
                              toggleJob.mutate({ id: j.id, is_active: !j.is_active });
                            }}
                          >
                            {j.is_active ? <PauseCircle className="size-4" /> : <PlusCircle className="size-4" />}
                            {j.is_active ? c.close : c.republish}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  }
                >
                  {openApplicants === j.id && <FacilityApplicantsPanel jobId={j.id} embedded />}
                </PublishedWorkCard>
              );
            })
          ) : (
            <EmptyState icon={Briefcase} title={c.noJobs} />
          )}
        </div>

        <div className={cn("mt-6 space-y-3", tab === "jobs" && "hidden")}>
          {shifts?.length ? (
            shifts.map((s) => {
              const ended = new Date(s.ends_at).getTime() <= Date.now();
              // الحجوزات الفعلية (نستثني الملغاة).
              const bookingRows = (
                Array.isArray(s.shift_bookings) ? s.shift_bookings : s.shift_bookings ? [s.shift_bookings] : []
              ) as { id: string; status: string }[];
              const bookings = bookingRows.filter((b) => b.status !== "cancelled").length;
              return (
                <PublishedWorkCard
                  key={s.id}
                  type="shift"
                  title={s.title}
                  to="/shifts/$shiftId"
                  params={{ shiftId: s.id }}
                  status={s.status as "open" | "booked" | "cancelled" | "completed"}
                  meta={
                    <>
                      {formatDateTime(s.starts_at, lang)} ·{" "}
                      {formatMoney(Number(s.hourly_rate), s.currency, lang)}
                      {c.perHour} · {s.city}
                    </>
                  }
                  actions={
                    <>
                      <WorkCountButton
                        type="shift"
                        count={bookings}
                        expanded={openBookings === s.id}
                        onToggle={() => setOpenBookings((v) => (v === s.id ? null : s.id))}
                      />
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/shifts/$shiftId" params={{ shiftId: s.id }}>
                          <Eye className="size-4" /> {c.view}
                        </Link>
                      </Button>
                      {(s.status === "open" || s.status === "booked") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="size-11 p-0" aria-label={c.moreActions}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {s.status === "open" && (
                              <DropdownMenuItem
                                className="min-h-11 gap-2"
                                onSelect={() => setInviteTarget({ kind: "shift", id: s.id })}
                              >
                                <UserPlus className="size-4" /> {c.invite}
                              </DropdownMenuItem>
                            )}
                            {s.status === "booked" && ended && (
                              <DropdownMenuItem
                                className="min-h-11 gap-2"
                                disabled={completeShift.isPending}
                                onSelect={async () => {
                                  const ok = await confirm({
                                    title: c.confirmCompleteTitle,
                                    description: c.confirmCompleteDesc,
                                    confirmLabel: c.confirmCompleteCta,
                                  });
                                  if (ok) completeShift.mutate(s.id);
                                }}
                              >
                                <CheckCircle2 className="size-4" /> {c.confirmCompleteCta}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="min-h-11 gap-2"
                              disabled={cancelShift.isPending}
                              onSelect={async () => {
                                const ok = await confirm({
                                  title: c.confirmCancelShiftTitle,
                                  description:
                                    s.status === "booked"
                                      ? c.confirmCancelBookedShiftDesc
                                      : c.confirmCancelShiftDesc,
                                  confirmLabel: c.confirmCancelShiftCta,
                                  destructive: true,
                                });
                                if (ok) cancelShift.mutate(s.id);
                              }}
                            >
                              <CircleSlash className="size-4" /> {c.cancelShift}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  }
                >
                  {openBookings === s.id && facility && (
                    <FacilityBookingsPanel
                      shiftId={s.id}
                      facilityId={facility.id}
                      shiftCompleted={s.status === "completed"}
                    />
                  )}
                </PublishedWorkCard>
              );
            })
          ) : (
            <EmptyState icon={CalendarClock} title={c.noShifts} />
          )}
        </div>


    </div>
  );
}

function DashboardMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Briefcase;
  value: number;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function FacilityForm() {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name_ar: "",
    facility_type: "hospital",
    country: "",
    city: "",
    description: "",
    website: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = z
        .object({
          name_ar: z.string().trim().min(2, c.nameRequired).max(120),
          country: z.string().min(1, c.countryRequired),
          city: z.string().trim().min(2, c.cityRequired).max(60),
        })
        .safeParse(form);
      if (!parsed.success) userError(parsed.error.issues[0]!.message);
      const { error } = await supabase.from("facilities").insert({
        user_id: user!.id,
        name_ar: form.name_ar.trim(),
        facility_type: form.facility_type,
        country: form.country,
        city: form.city.trim(),
        description: form.description.trim() || null,
        website: form.website.trim() || null,
      });
      if (error) throw error;
      assertOk(await supabase.rpc("claim_facility_role"));
    },
    onSuccess: () => {
      toast.success(c.createdFacility);
      queryClient.invalidateQueries({ queryKey: ["my-facility"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.registerTitle}</h1>
      <p className="mt-2 text-muted-foreground">{c.registerSub}</p>

      <div className="card-lift mt-6 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
        <div>
          <Label htmlFor="fname">{c.facilityName}</Label>
          <Input id="fname" maxLength={120} value={form.name_ar}
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{c.facilityType}</Label>
            <Combobox
              options={[
                { value: "hospital", label: c.hospital },
                { value: "clinic", label: c.clinic },
                { value: "polyclinic", label: c.polyclinic },
                { value: "pharmacy", label: c.pharmacy },
                { value: "lab", label: c.lab },
              ]}
              value={form.facility_type}
              onChange={(v) => setForm({ ...form, facility_type: v })}
              placeholder={c.facilityType}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </div>
          <div>
            <Label>{c.country}</Label>
            <Combobox
              options={countryOptions(lang)}
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v, city: "" })}
              placeholder={c.pickCountry}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </div>
          <div>
            <Label>{c.city}</Label>
            <Combobox
              options={cityOptions(form.country, lang)}
              value={form.city}
              disabled={!form.country}
              onChange={(v) => setForm({ ...form, city: v })}
              placeholder={form.country ? ct.choose : ct.pickCountryFirst}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
              allowCustom
              customLabel={ct.add}
            />
          </div>
          <div>
            <Label htmlFor="fweb">{c.website}</Label>
            <Input id="fweb" dir="ltr" maxLength={200} value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="fdesc">{c.description}</Label>
          <Textarea id="fdesc" rows={4} maxLength={1000} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Button className="w-full sm:w-auto" onClick={() => save.mutate()} loading={save.isPending}>
          {save.isPending ? c.saving : c.createFacility}
        </Button>
      </div>
    </div>
  );
}

type Spec = { id: string; name_ar: string; name_en?: string | null };

function JobForm({
  facilityId,
  facilityNames,
  specialties,
  defaults,
  quotaReached,
  expired,
  onCreated,
}: {
  facilityId: string;
  facilityNames?: (string | null | undefined)[];
  specialties: Spec[];
  defaults: { country: string; city: string };
  quotaReached?: boolean;
  expired?: boolean;
  onCreated?: (id: string) => void;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "review">("form");
  const [draftReady, setDraftReady] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    specialty_id: "",
    employment_type: "full_time",
    country: defaults.country,
    city: defaults.city,
    salary_min: "",
    salary_max: "",
    currency: "YER",
    min_experience: "0",
    vacancies: "1",
    required_license: "",
  });
  const draftKey = `syndeocare:listing-draft:job:${facilityId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setForm((current) => ({ ...current, ...(JSON.parse(saved) as Partial<typeof form>) }));
    } catch {
      localStorage.removeItem(draftKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady) return;
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [draftKey, draftReady, form]);

  useEffect(() => {
    setForm((f) => ({ ...f, country: f.country || defaults.country, city: f.city || defaults.city }));
  }, [defaults.country, defaults.city]);

  /** تحقق كامل قبل عرض شاشة المراجعة أو النشر. */
  function validate() {
    if (expired) userError(c.subExpiredJob);
    if (quotaReached) userError(c.quotaReachedJob);
    const parsed = z
      .object({
        title: z.string().trim().min(3, c.titleMin).max(120),
        description: z.string().trim().min(20, c.descMin).max(5000),
        salary_min: z.number().min(0),
        salary_max: z.number().min(0),
      })
      .safeParse({
        title: form.title,
        description: form.description,
        salary_min: Number(form.salary_min),
        salary_max: Number(form.salary_max),
      });
    if (!parsed.success) userError(parsed.error.issues[0]!.message);
    if (parsed.data.salary_max < parsed.data.salary_min) userError(c.salaryMaxGt);
    if (hasIdentityDisclosure(`${parsed.data.title} ${parsed.data.description}`, facilityNames ?? [])) {
      userError(c.privacyBlocked);
    }
    if (!form.country) userError(c.countryRequired);
    if (!form.city.trim()) userError(c.cityRequired);
    return parsed.data;
  }

  function goReview() {
    try {
      validate();
      setStep("review");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const create = useMutation({
    mutationFn: async () => {
      const parsed = validate();
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          facility_id: facilityId,
          title: form.title.trim(),
          description: form.description.trim(),
          specialty_id: form.specialty_id || null,
          employment_type: form.employment_type as "full_time",
          country: form.country,
          city: form.city.trim(),
          salary_min: parsed.salary_min,
          salary_max: parsed.salary_max,
          currency: form.currency,
          min_experience: Number(form.min_experience) || 0,
          vacancies: Math.min(Math.max(Number(form.vacancies) || 1, 1), 50),
          required_license: form.required_license || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      localStorage.removeItem(draftKey);
      toast.success(c.jobPublished);
      setForm({ ...form, title: "", description: "", salary_min: "", salary_max: "" });
      setStep("form");
      queryClient.invalidateQueries({ queryKey: ["facility-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onCreated?.(id);
      void navigate({ to: "/facility", search: { tab: "jobs" }, replace: true });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.publishFailed)),
  });

  if (step === "review") {
    const specName = specialtyName(specialties.find((s) => s.id === form.specialty_id), lang);
    return (
      <ReviewStep
        steps={c.publishSteps}
        title={c.reviewTitle}
        subtitle={c.reviewSub}
        rows={[
          { label: c.jobTitle, value: form.title.trim() },
          { label: c.specialty, value: specName ?? c.notSet },
          { label: c.employmentType, value: employmentLabel(form.employment_type, lang) },
          { label: c.minExperience, value: String(Number(form.min_experience) || 0) },
          { label: c.vacancies, value: String(Math.max(Number(form.vacancies) || 1, 1)) },
          {
            label: c.country + " / " + c.city,
            value: [countryLabel(form.country, lang), form.city.trim()].filter(Boolean).join(" — "),
          },
          {
            label: c.salaryRange,
            value: `${Number(form.salary_min).toLocaleString()} – ${Number(form.salary_max).toLocaleString()} ${form.currency}`,
          },
          { label: c.requiredLicense, value: form.required_license ? countryLabel(form.required_license, lang) : c.none },
          { label: c.jobDesc, value: form.description.trim() },
        ]}
        note={c.privacyReview}
        backLabel={c.backToEdit}
        confirmLabel={create.isPending ? c.publishing : c.confirmPublish}
        onBack={() => setStep("form")}
        onConfirm={() => create.mutate()}
        pending={create.isPending}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card sm:p-6">
      <StepIndicator steps={c.publishSteps} current={0} />
      <div className="grid gap-4 sm:grid-cols-2">

        <div>
          <Label htmlFor="jt">{c.jobTitle}</Label>
          <Input id="jt" maxLength={120} value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>{c.specialty}</Label>
          <Combobox
            options={specialties.map((s) => ({
              value: s.id,
              label: specialtyName(s, lang) ?? "",
              keywords: [s.name_ar, s.name_en].filter(Boolean) as string[],
            }))}
            value={form.specialty_id}
            onChange={(v) => setForm({ ...form, specialty_id: v })}
            placeholder={c.pickSpecialty}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.employmentType}</Label>
          <Combobox
            options={["full_time", "part_time", "contract", "locum", "shift"].map((k) => ({
              value: k,
              label: employmentLabel(k, lang),
              keywords: [k],
            }))}
            value={form.employment_type}
            onChange={(v) => setForm({ ...form, employment_type: v })}
            placeholder={ct.choose}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label htmlFor="jexp">{c.minExperience}</Label>
          <Input id="jexp" type="number" min={0} max={40} value={form.min_experience}
            onChange={(e) => setForm({ ...form, min_experience: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jvac">{c.vacancies}</Label>
          <Input id="jvac" type="number" min={1} max={50} value={form.vacancies}
            onChange={(e) => setForm({ ...form, vacancies: e.target.value })} />
          <p className="mt-1 text-xs text-muted-foreground">{c.vacanciesHint}</p>
        </div>
        <div>
          <Label>{c.country}</Label>
          <Combobox
            options={countryOptions(lang)}
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v, city: "" })}
            placeholder={c.pickCountry}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.city}</Label>
          <Combobox
            options={cityOptions(form.country, lang)}
            value={form.city}
            disabled={!form.country}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder={form.country ? ct.choose : ct.pickCountryFirst}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
            allowCustom
            customLabel={ct.add}
          />
        </div>
        <div>
          <Label htmlFor="jmin">{c.salaryFrom}</Label>
          <Input id="jmin" type="number" min={0} value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jmax">{c.salaryTo}</Label>
          <Input id="jmax" type="number" min={0} value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
        </div>
        <div>
          <Label>{c.currency}</Label>
          <Combobox
            options={currencyOptions(lang)}
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
            placeholder={ct.choose}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.requiredLicense}</Label>
          <Combobox
            options={countryOptions(lang)}
            value={form.required_license}
            onChange={(v) => setForm({ ...form, required_license: v })}
            placeholder={c.licensePlaceholder}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="jdesc">{c.jobDesc}</Label>
        <Textarea id="jdesc" rows={6} maxLength={5000} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          aria-describedby="jdesc-privacy" />
        <p id="jdesc-privacy" className="mt-1.5 text-xs text-muted-foreground">{c.privacyHint}</p>
      </div>
      <p className="text-xs text-muted-foreground">{c.draftSaved}</p>
      {(expired || quotaReached) && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {expired ? c.subExpiredJob : c.quotaReachedJob}
        </p>
      )}
      <Button className="w-full sm:w-auto" onClick={goReview} disabled={create.isPending || expired || quotaReached}>
        {c.reviewCta}
      </Button>
    </div>
  );
}

function ShiftForm({
  facilityId,
  facilityNames,
  specialties,
  defaults,
  quotaReached,
  expired,
  onCreated,
}: {
  facilityId: string;
  facilityNames?: (string | null | undefined)[];
  specialties: Spec[];
  defaults: { country: string; city: string };
  quotaReached?: boolean;
  expired?: boolean;
  onCreated?: (id: string) => void;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "review">("form");
  const [draftReady, setDraftReady] = useState(false);
  const [form, setForm] = useState({
    title: "",
    specialty_id: "",
    starts_at: "",
    ends_at: "",
    hourly_rate: "",
    currency: "YER",
    country: defaults.country,
    city: defaults.city,
    notes: "",
  });
  const draftKey = `syndeocare:listing-draft:shift:${facilityId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setForm((current) => ({ ...current, ...(JSON.parse(saved) as Partial<typeof form>) }));
    } catch {
      localStorage.removeItem(draftKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady) return;
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [draftKey, draftReady, form]);

  /** تحقق كامل قبل عرض شاشة المراجعة أو النشر. */
  function validate() {
    if (expired) userError(c.subExpiredShift);
    if (quotaReached) userError(c.quotaReachedShift);
    if (form.title.trim().length < 3) userError(c.shiftTitleMin);
    if (!form.starts_at || !form.ends_at) userError(c.setTimes);
    const startMs = new Date(form.starts_at).getTime();
    const endMs = new Date(form.ends_at).getTime();
    if (endMs <= startMs) userError(c.endAfterStart);
    if (startMs <= Date.now()) userError(c.startInPast);
    if (endMs - startMs > 24 * 60 * 60 * 1000) userError(c.tooLong);
    if (!Number(form.hourly_rate)) userError(c.hourlyRateRequired);
    if (hasIdentityDisclosure(`${form.title} ${form.notes}`, facilityNames ?? [])) {
      userError(c.privacyBlocked);
    }
    if (!form.country) userError(c.countryRequired);
    if (!form.city.trim()) userError(c.cityRequired);
    return { startMs, endMs };
  }

  function goReview() {
    try {
      validate();
      setStep("review");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const create = useMutation({
    mutationFn: async () => {
      validate();
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          facility_id: facilityId,
          title: form.title.trim(),
          specialty_id: form.specialty_id || null,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          hourly_rate: Number(form.hourly_rate),
          currency: form.currency,
          country: form.country,
          city: form.city.trim(),
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      localStorage.removeItem(draftKey);
      toast.success(c.shiftPublished);
      setForm({ ...form, title: "", starts_at: "", ends_at: "", hourly_rate: "", notes: "" });
      setStep("form");
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      onCreated?.(id);
      void navigate({ to: "/facility", search: { tab: "shifts" }, replace: true });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.publishFailed)),
  });

  const [endAdjusted, setEndAdjusted] = useState(false);

  /** قيمة datetime-local من تاريخ محلي (بلا تحويل منطقة زمنية). */
  function toLocalInput(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const startMsField = form.starts_at ? new Date(form.starts_at).getTime() : Number.NaN;
  const endMsField = form.ends_at ? new Date(form.ends_at).getTime() : Number.NaN;
  const startFieldError =
    form.starts_at && Number.isFinite(startMsField) && startMsField <= Date.now() ? c.startInPast : null;
  const endFieldError =
    !form.ends_at || !Number.isFinite(endMsField)
      ? null
      : !Number.isFinite(startMsField)
        ? null
        : endMsField <= startMsField
          ? c.endAfterStart
          : endMsField - startMsField > 24 * 3600_000
            ? c.tooLong
            : null;



  if (step === "review") {
    const hours = form.starts_at && form.ends_at
      ? ((new Date(form.ends_at).getTime() - new Date(form.starts_at).getTime()) / 3600_000).toFixed(1)
      : "0";
    const specName = specialtyName(specialties.find((s) => s.id === form.specialty_id), lang);
    return (
      <ReviewStep
        steps={c.publishSteps}
        title={c.reviewTitle}
        subtitle={c.reviewSub}
        rows={[
          { label: c.shiftTitle, value: form.title.trim() },
          { label: c.specialty, value: specName ?? c.notSet },
          { label: c.shiftStartsAt, value: formatDateTime(new Date(form.starts_at).toISOString(), lang) },
          { label: c.shiftEndsAt, value: formatDateTime(new Date(form.ends_at).toISOString(), lang) },
          { label: c.duration(hours), value: "" },
          { label: c.hourlyRate, value: `${Number(form.hourly_rate).toLocaleString()} ${form.currency}` },
          {
            label: c.country + " / " + c.city,
            value: [countryLabel(form.country, lang), form.city.trim()].filter(Boolean).join(" — "),
          },
          { label: c.notes, value: form.notes.trim() || c.none },
        ]}
        note={c.privacyReview}
        backLabel={c.backToEdit}
        confirmLabel={create.isPending ? c.publishing : c.confirmPublish}
        onBack={() => setStep("form")}
        onConfirm={() => create.mutate()}
        pending={create.isPending}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card sm:p-6">
      <StepIndicator steps={c.publishSteps} current={0} />
      <div className="grid gap-4 sm:grid-cols-2">

        <div>
          <Label htmlFor="st">{c.shiftTitle}</Label>
          <Input id="st" maxLength={120} placeholder={c.shiftTitlePlaceholder} value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>{c.specialty}</Label>
          <Combobox
            options={specialties.map((s) => ({
              value: s.id,
              label: specialtyName(s, lang) ?? "",
              keywords: [s.name_ar, s.name_en].filter(Boolean) as string[],
            }))}
            value={form.specialty_id}
            onChange={(v) => setForm({ ...form, specialty_id: v })}
            placeholder={c.pickSpecialty}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label htmlFor="ss">
            {c.shiftStartsAt} <span className="font-normal text-muted-foreground">({c.localTimeHint})</span>
          </Label>
          <Input id="ss" type="datetime-local" value={form.starts_at}
            min={toLocalInput(new Date(Date.now() + 60_000))}
            aria-invalid={!!startFieldError}
            aria-describedby={startFieldError ? "ss-error" : undefined}
            onChange={(e) => {
              const v = e.target.value;
              let end = form.ends_at;
              const startMs = new Date(v).getTime();
              const stale =
                !!v &&
                (!end || new Date(end).getTime() <= startMs || new Date(end).getTime() - startMs > 24 * 3600_000);
              if (stale) end = toLocalInput(new Date(startMs + 8 * 3600_000));
              setEndAdjusted(stale && !!form.ends_at);
              setForm({ ...form, starts_at: v, ends_at: end });
            }} />
          {startFieldError && (
            <p id="ss-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
              {startFieldError}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="se">
            {c.shiftEndsAt} <span className="font-normal text-muted-foreground">({c.localTimeHint})</span>
          </Label>
          <Input id="se" type="datetime-local" value={form.ends_at}
            min={form.starts_at || undefined}
            aria-invalid={!!endFieldError}
            aria-describedby={endFieldError ? "se-error" : endAdjusted ? "se-hint" : undefined}
            onChange={(e) => {
              setEndAdjusted(false);
              setForm({ ...form, ends_at: e.target.value });
            }} />
          {endFieldError ? (
            <p id="se-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
              {endFieldError}
            </p>
          ) : endAdjusted ? (
            <p id="se-hint" className="mt-1.5 text-xs text-muted-foreground">{c.endAdjusted}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="sr">{c.hourlyRate}</Label>
          <Input id="sr" type="number" min={0} value={form.hourly_rate}
            onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
        </div>
        <div>
          <Label>{c.currency}</Label>
          <Combobox
            options={currencyOptions(lang)}
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
            placeholder={ct.choose}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.country}</Label>
          <Combobox
            options={countryOptions(lang)}
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v, city: "" })}
            placeholder={c.pickCountry}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.city}</Label>
          <Combobox
            options={cityOptions(form.country, lang)}
            value={form.city}
            disabled={!form.country}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder={form.country ? ct.choose : ct.pickCountryFirst}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
            allowCustom
            customLabel={ct.add}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="snotes">{c.notes}</Label>
        <Textarea id="snotes" rows={3} maxLength={1000} value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          aria-describedby="snotes-privacy" />
        <p id="snotes-privacy" className="mt-1.5 text-xs text-muted-foreground">{c.privacyHint}</p>
      </div>
      <p className="text-xs text-muted-foreground">{c.draftSaved}</p>
      {(expired || quotaReached) && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {expired ? c.subExpiredShift : c.quotaReachedShift}
        </p>
      )}
      <Button
        className="w-full sm:w-auto"
        onClick={goReview}
        disabled={create.isPending || expired || quotaReached || !!startFieldError || !!endFieldError}
      >
        {c.reviewCta}
      </Button>
    </div>
  );
}

/** شاشة مراجعة موحّدة قبل نشر أي عمل (وظيفة أو مناوبة). */
function ReviewStep({
  steps,
  title,
  subtitle,
  rows,
  note,
  backLabel,
  confirmLabel,
  onBack,
  onConfirm,
  pending,
}: {
  steps?: readonly string[];
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
  note?: string;
  backLabel: string;
  confirmLabel: string;
  onBack: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card sm:p-6">
      {steps && <StepIndicator steps={steps} current={1} />}
      <div>
        <h3 className="font-display text-lg font-extrabold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 p-3 sm:grid-cols-3 sm:gap-3">
            <dt className="text-sm font-semibold text-muted-foreground">{r.label}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm sm:col-span-2">{r.value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="min-h-11" onClick={onBack} disabled={pending}>
          <ArrowRight className="size-4 rtl:rotate-180" /> {backLabel}
        </Button>
        <Button className="min-h-11" onClick={onConfirm} disabled={pending}>
          <CheckCircle2 className="size-4" /> {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
