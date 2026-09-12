import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CalendarClock, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobCard, type JobRow } from "@/components/job-card";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { matchScore } from "@/lib/match";
import { applicationLabel, formatDateTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";

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
    completeText: "بدون التخصص وسنوات الخبرة لن نستطيع حساب نسبة التوافق أو ترشيح الوظائف المناسبة لك.",
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
  },
  en: {
    hello: (name: string) => `Hello ${name}`,
    you: "there",
    sub: "Here's a quick snapshot of your account today.",
    completeTitle: "Complete your professional profile first",
    completeText: "Without your specialty and years of experience we can't calculate a match score or recommend the right jobs for you.",
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
  },
} as const;

function Dashboard() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const navigate = useNavigate();

  useEffect(() => {
    if (roles?.includes("facility")) navigate({ to: "/facility", replace: true });
  }, [roles, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-pro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("healthcare_professionals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: apps } = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,created_at,jobs(id,title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: creds } = useQuery({
    queryKey: ["my-creds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("credentials").select("status").eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["my-shifts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_bookings")
        .select("id,shifts(id,title,starts_at)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["recommended-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,slug,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialty_id,required_license,specialties(name_ar,name_en)",
        )
        .eq("is_active", true)
        .limit(20);
      if (error) throw error;
      return data as unknown as (JobRow & { specialty_id: string | null; required_license: string | null })[];
    },
  });

  const approved = (creds ?? []).filter((c) => c.status === "approved").length;
  const ranked = (jobs ?? [])
    .map((j) => ({
      job: j,
      score:
        matchScore(profile ?? null, {
          specialty_id: j.specialty_id,
          min_experience: j.min_experience,
          country: j.country,
          required_license: j.required_license,
        }) ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">
        {c.hello(profile?.full_name || c.you)}
      </h1>
      <p className="mt-2 text-muted-foreground">{c.sub}</p>

      {!profile && (
        <div className="mt-6 rounded-2xl border border-warning/40 bg-warning/10 p-5">
          <h2 className="font-bold">{c.completeTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.completeText}
          </p>
          <Button className="mt-4" asChild><Link to="/profile">{c.completeCta}</Link></Button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} value={apps?.length ?? 0} label={c.statApps} to="/applications" />
        <StatCard icon={ShieldCheck} value={approved} label={c.statCreds} to="/credentials" />
        <StatCard icon={CalendarClock} value={bookings?.length ?? 0} label={c.statShifts} to="/my-shifts" />
        <StatCard icon={Sparkles} value={profile?.years_experience ?? 0} label={c.statYears} to="/profile" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card-lift rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">{c.latestApps}</h2>
          {apps?.length ? (
            <ul className="mt-4 space-y-3">
              {apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{a.jobs?.title}</p>
                    
                  </div>
                  <Badge variant="secondary">{applicationLabel(a.status, lang)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{c.noApps}</p>
          )}
        </section>

        <section className="card-lift rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">{c.upcomingShifts}</h2>
          {bookings?.length ? (
            <ul className="mt-4 space-y-3">
              {bookings.map((b) => (
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
              {c.noShifts} <Link to="/shifts" className="text-primary underline">{c.browseMarket}</Link>
            </p>
          )}
        </section>
      </div>

      {ranked.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-extrabold">{c.recommended}</h2>
          <div className="mt-6 space-y-3">
            {ranked.map(({ job, score }) => (
              <JobCard key={job.id} job={job} match={profile ? score : null} />
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
}: {
  icon: typeof FileText;
  value: number;
  label: string;
  to: "/applications" | "/credentials" | "/my-shifts" | "/profile";
}) {
  return (
    <Link to={to} className="card-lift rounded-2xl border border-border bg-card p-5">
      <Icon className="size-5 text-primary" />
      <div className="mt-3 font-display text-3xl font-extrabold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}
