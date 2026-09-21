import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Briefcase, CalendarClock, FileText, Mail, MessageSquare, ShieldCheck, Sparkles, UserRound, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobCard, type JobRow } from "@/components/job-card";
import { ErrorState } from "@/components/error-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { publicJobsQuery, withSpecialties } from "@/lib/public-listings";
import { useRoles, useSession } from "@/lib/auth";
import { applicationLabel, formatDateTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { isProfessionalProfileComplete } from "@/lib/profile-completeness";
import { NextStepCard, QuickAction, SectionHeading, WorkspaceHeading } from "@/components/workspace-ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحتي | SyndeoCare" },
      { name: "description", content: "متابعة طلباتك ومناوباتك وحالة توثيق ترخيصك في مكان واحد." },
      { property: "og:title", content: "لوحتي | SyndeoCare" },
      { property: "og:description", content: "طلباتك ومناوباتك وحالة التوثيق." },
    ],
  }),
  component: Dashboard,
});

const TXT = {
  ar: {
    hello: (name: string) => `أهلاً ${name}`,
    you: "بك",
    sub: "هذه صورة سريعة عن حسابك اليوم.",
    completeTitle: "أكمل ملفك المهني أولاً",
    completeText: "أضف تخصصك وسنوات الخبرة لنرتّب لك الوظائف الأقرب إلى ملفك.",
    completeCta: "إكمال الملف المهني",
    statApps: "طلب تقديم",
    statCreds: "وثيقة موثّقة",
    statShifts: "مناوبة محجوزة",
    statYears: "سنة خبرة",
    latestApps: "آخر الطلبات",
    noApps: "لم تتقدم لأي وظيفة بعد.",
    upcomingShifts: "مناوباتك القادمة",
    noShifts: "لا مناوبات محجوزة.",
    browseMarket: "تصفح السوق",
    recommended: "وظائف مرشّحة لك",
    workspace: "مساحة الكادر الصحي",
    nextStep: "خطوتك التالية",
    invitationsTitle: (n: number) => `لديك ${n} دعوة بانتظار ردك`,
    invitationsText: "راجع تفاصيل العمل ورد على المنشأة من مكان واحد.",
    viewInvitations: "عرض الدعوات",
    interviewsTitle: (n: number) => `لديك ${n} مقابلة تحتاج ردك`,
    interviewsText: "راجع الموعد المقترح وأكّد حضورك أو اعتذر للمنشأة.",
    viewInterviews: "مراجعة المقابلات",
    discover: "استكشف الفرص",
    discoverText: "وظائف ومناوبات في مكان واحد",
    activity: "تابع نشاطك",
    activityText: "طلباتك وحجوزاتك والمحفوظات",
    messages: "الرسائل",
    messagesText: "تابع محادثاتك مع المنشآت",
    profile: "ملفك المهني",
    profileText: "راجع ما تراه المنشآت عنك",
    quickActions: "وصول سريع",
    viewAll: "عرض الكل",
    browseNow: "تصفح الفرص",
    continueTitle: "لديك طلب قيد المتابعة",
    continueText: "راجع مرحلته الحالية وأي مقابلة أو تحديث جديد من المنشأة.",
    continueCta: "متابعة الطلبات",
    shiftTitle: "لديك مناوبة قادمة",
    shiftText: "راجع الموعد والموقع والتفاصيل قبل بدء المناوبة.",
    shiftCta: "عرض مناوباتي",
  },
  en: {
    hello: (name: string) => `Hello ${name}`,
    you: "there",
    sub: "Here's a quick snapshot of your account today.",
    completeTitle: "Complete your professional profile first",
    completeText: "Add your specialty and experience so we can order the most relevant jobs first.",
    completeCta: "Complete profile",
    statApps: "Application",
    statCreds: "Verified document",
    statShifts: "Booked shift",
    statYears: "Years of experience",
    latestApps: "Latest applications",
    noApps: "You haven't applied to any job yet.",
    upcomingShifts: "Your upcoming shifts",
    noShifts: "No shifts booked.",
    browseMarket: "Browse marketplace",
    recommended: "Jobs recommended for you",
    workspace: "Healthcare professional workspace",
    nextStep: "Your next step",
    invitationsTitle: (n: number) => `${n} invitation(s) await your response`,
    invitationsText: "Review the work details and reply to the employer in one place.",
    viewInvitations: "View invitations",
    interviewsTitle: (n: number) => `${n} interview(s) need your reply`,
    interviewsText: "Review the proposed time and confirm attendance or decline.",
    viewInterviews: "Review interviews",
    discover: "Explore opportunities",
    discoverText: "Jobs and shifts in one place",
    activity: "Track activity",
    activityText: "Applications, bookings and saved work",
    messages: "Messages",
    messagesText: "Continue conversations with employers",
    profile: "Professional profile",
    profileText: "Review what employers see about you",
    quickActions: "Quick access",
    viewAll: "View all",
    browseNow: "Browse opportunities",
    continueTitle: "You have an application in progress",
    continueText: "Review its current stage and any interview or employer update.",
    continueCta: "Track applications",
    shiftTitle: "You have an upcoming shift",
    shiftText: "Review the time, location and details before the shift starts.",
    shiftCta: "View my shifts",
  },
} as const;

function Dashboard() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roles) return;
    if (roles.includes("admin")) navigate({ to: "/admin", replace: true });
    else if (roles.includes("facility")) navigate({ to: "/facility", replace: true });
  }, [roles, navigate]);

  const { data: profile, isError: profileErr, isPending: profilePending, refetch: profileRefetch } = useQuery({
    queryKey: ["my-pro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("healthcare_professionals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: apps, isError: appsErr, isPending: appsPending, refetch: appsRefetch } = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,created_at,jobs(id,title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
      if (error) throw error;
      return data;
    },
  });

  const { data: creds, isError: credsErr, isPending: credsPending, refetch: credsRefetch } = useQuery({
    queryKey: ["my-creds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("credentials").select("status").eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: bookings, isError: bookingsErr, isPending: bookingsPending, refetch: bookingsRefetch } = useQuery({
    queryKey: ["my-shifts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_bookings")
        .select("id,status,shifts(id,title,starts_at)")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pendingInvites, isError: pendingInvitesErr, isPending: pendingInvitesPending, refetch: pendingInvitesRefetch } = useQuery({
    queryKey: ["pending-invitations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("professional_user_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: pendingInterviews, isError: pendingInterviewsErr, isPending: pendingInterviewsPending, refetch: pendingInterviewsRefetch } = useQuery({
    queryKey: ["pending-interviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("interviews")
        .select("id", { count: "exact", head: true })
        .eq("professional_user_id", user.id)
        .eq("status", "scheduled");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: jobs, isError: jobsErr, refetch: jobsRefetch } = useQuery({
    queryKey: ["recommended-jobs"],
    queryFn: async () => {
      const { data, error } = await publicJobsQuery().limit(20);
      if (error) throw error;
      return withSpecialties(data) as unknown as (JobRow & {
        specialty_id: string | null;
        required_license: string | null;
      })[];
    },
  });

  const approved = (creds ?? []).filter((c) => c.status === "approved").length;
  const upcomingBookings = (bookings ?? []).filter(
    (booking) => booking.shifts && new Date(booking.shifts.starts_at).getTime() > Date.now(),
  );
  const activeApplications = (apps ?? []).filter(
    (application) => !["hired", "rejected", "withdrawn"].includes(application.status),
  );
  const ranked = (jobs ?? [])
    .map((job) => ({ job }))
    .sort((a, b) => {
      const aSpecialty = profile?.specialty_id && a.job.specialty_id === profile.specialty_id ? 1 : 0;
      const bSpecialty = profile?.specialty_id && b.job.specialty_id === profile.specialty_id ? 1 : 0;
      if (aSpecialty !== bSpecialty) return bSpecialty - aSpecialty;
      const aCountry = profile?.country && a.job.country === profile.country ? 1 : 0;
      const bCountry = profile?.country && b.job.country === profile.country ? 1 : 0;
      return bCountry - aCountry;
    })
    .slice(0, 3);

  // لا نعرض "الخطوة التالية" قبل وصول البيانات التي تحدّدها — تجنباً لوميض رسالة خاطئة.
  const nextStepPending =
    !user || profilePending || appsPending || bookingsPending || pendingInvitesPending || pendingInterviewsPending;

  // وجهة "الخطوة التالية" الحالية — نستبعد نفس الوجهة من "وصول سريع" حتى لا يتكرر الإجراء.
  const nextStepTarget: string | null = nextStepPending
    ? null
    : !profile
      ? "/profile"
      : pendingInvites
        ? "/invitations"
        : pendingInterviews || activeApplications.length > 0 || upcomingBookings.length > 0
          ? "/activity"
          : "/jobs";

  const quickActions = [
    { icon: Briefcase, label: c.discover, description: c.discoverText, to: "/jobs" as const },
    { icon: FileText, label: c.activity, description: c.activityText, to: "/activity" as const },
    { icon: MessageSquare, label: c.messages, description: c.messagesText, to: "/messages" as const },
    { icon: UserRound, label: c.profile, description: c.profileText, to: "/profile" as const },
  ].filter((a) => a.to !== nextStepTarget);

  const loadErrors = [
    { err: profileErr, retry: profileRefetch },
    { err: appsErr, retry: appsRefetch },
    { err: credsErr, retry: credsRefetch },
    { err: bookingsErr, retry: bookingsRefetch },
    { err: pendingInvitesErr, retry: pendingInvitesRefetch },
    { err: pendingInterviewsErr, retry: pendingInterviewsRefetch },
    { err: jobsErr, retry: jobsRefetch },
  ].filter((q) => q.err);
  if (loadErrors.length > 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ErrorState
          onRetry={() => {
            for (const q of loadErrors) void q.retry();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <WorkspaceHeading eyebrow={c.workspace} title={c.hello(profile?.full_name || c.you)} description={c.sub} />

      <div className="mt-6">
        {nextStepPending ? (
          <div
            className="h-28 animate-pulse rounded-lg border border-border bg-muted/40"
            aria-hidden="true"
          />
        ) : !isProfessionalProfileComplete(profile) ? (
          <NextStepCard
            icon={UserRound}
            label={c.nextStep}
            title={c.completeTitle}
            description={c.completeText}
            tone="warning"
            action={<Button variant="secondary" asChild><Link to="/profile">{c.completeCta}</Link></Button>}
          />
        ) : pendingInvites ? (
          <NextStepCard
            icon={Mail}
            label={c.nextStep}
            title={c.invitationsTitle(pendingInvites)}
            description={c.invitationsText}
            action={<Button variant="secondary" asChild><Link to="/invitations">{c.viewInvitations}<ArrowLeft className="ltr:rotate-180" /></Link></Button>}
          />
        ) : pendingInterviews ? (
          <NextStepCard
            icon={Video}
            label={c.nextStep}
            title={c.interviewsTitle(pendingInterviews)}
            description={c.interviewsText}
            tone="warning"
            action={<Button variant="secondary" asChild><Link to="/activity" search={{ tab: "applications" }}>{c.viewInterviews}<ArrowLeft className="ltr:rotate-180" /></Link></Button>}
          />
        ) : activeApplications.length > 0 ? (
          <NextStepCard
            icon={FileText}
            label={c.nextStep}
            title={c.continueTitle}
            description={c.continueText}
            tone="accent"
            action={<Button variant="secondary" asChild><Link to="/activity" search={{ tab: "applications" }}>{c.continueCta}<ArrowLeft className="ltr:rotate-180" /></Link></Button>}
          />
        ) : upcomingBookings.length > 0 ? (
          <NextStepCard
            icon={CalendarClock}
            label={c.nextStep}
            title={c.shiftTitle}
            description={c.shiftText}
            tone="accent"
            action={<Button variant="secondary" asChild><Link to="/activity" search={{ tab: "shifts" }}>{c.shiftCta}<ArrowLeft className="ltr:rotate-180" /></Link></Button>}
          />
        ) : (
          <NextStepCard
            icon={Briefcase}
            label={c.nextStep}
            title={c.discover}
            description={c.discoverText}
            tone="accent"
            action={<Button variant="secondary" asChild><Link to="/jobs">{c.browseNow}<ArrowLeft className="ltr:rotate-180" /></Link></Button>}
          />
        )}
      </div>

      <section className="mt-8">
        <SectionHeading title={c.quickActions} />
        <div
          className={`mt-3 grid gap-3 sm:grid-cols-2 ${quickActions.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {quickActions.map((a) => (
            <QuickAction key={a.to} icon={a.icon} label={a.label} description={a.description} to={a.to} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FileText} value={apps?.length ?? 0} pending={appsPending} label={c.statApps} to="/activity" />
        <StatCard icon={ShieldCheck} value={approved} pending={credsPending} label={c.statCreds} to="/profile" />
        <StatCard icon={CalendarClock} value={upcomingBookings.length} pending={bookingsPending} label={c.statShifts} to="/activity" />
        <StatCard icon={Sparkles} value={profile?.years_experience ?? 0} pending={profilePending} label={c.statYears} to="/profile" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5 shadow-card">
          <SectionHeading title={c.latestApps} action={<Button variant="link" size="sm" asChild><Link to="/activity" search={{ tab: "applications" }}>{c.viewAll}</Link></Button>} />
          {appsPending ? (
            <div className="mt-4">
              <ListSkeleton rows={2} />
            </div>
          ) : apps?.length ? (
            <ul className="mt-4 space-y-3">
              {apps.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                  {a.jobs ? (
                    <Link to="/jobs/$jobId" params={{ jobId: a.jobs.id }} className="min-w-0 font-medium hover:text-primary">
                      {a.jobs.title}
                    </Link>
                  ) : <span className="text-sm text-muted-foreground">—</span>}
                  <Badge variant="secondary">{applicationLabel(a.status, lang)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{c.noApps}</p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-card">
          <SectionHeading title={c.upcomingShifts} action={<Button variant="link" size="sm" asChild><Link to="/activity" search={{ tab: "shifts" }}>{c.viewAll}</Link></Button>} />
          {bookingsPending ? (
            <div className="mt-4">
              <ListSkeleton rows={2} />
            </div>
          ) : upcomingBookings.length ? (
            <ul className="mt-4 space-y-3">
              {upcomingBookings.slice(0, 4).map((b) => (
                <li key={b.id} className="border-b border-border pb-3 last:border-0">
                  <p className="font-medium">{b.shifts?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.shifts && formatDateTime(b.shifts.starts_at, lang)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
               {c.noShifts} <Link to="/jobs" search={{ kind: "shift" }} className="text-primary-strong underline">{c.browseMarket}</Link>
            </p>
          )}
        </section>
      </div>

      {ranked.length > 0 && (
        <section className="mt-10">
          <SectionHeading title={c.recommended} action={<Button variant="link" size="sm" asChild><Link to="/jobs">{c.viewAll}</Link></Button>} />
          <div className="mt-6 space-y-3">
            {ranked.map(({ job }) => (
              <JobCard key={job.id} job={job} recommended={!!profile} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  to,
  pending = false,
}: {
  icon: typeof FileText;
  value: number;
  label: string;
  to: "/activity" | "/profile";
  /** While loading we reserve the number's space instead of showing a false 0. */
  pending?: boolean;
}) {
  return (
    <Link to={to} className="grid min-h-28 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/35">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
      <span className="min-w-0">
        {pending ? (
          <Skeleton className="my-1 block h-6 w-10" />
        ) : (
          <span className="block text-2xl font-extrabold tabular-nums">{value}</span>
        )}
        <span className="block text-xs leading-5 text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}
