import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Briefcase, Building2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertsPanel } from "@/components/panels/alerts";
import { ApplicantReportPanel } from "@/components/panels/applicant-report";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

type PrefSearch = { tab?: string };

export const Route = createFileRoute("/_authenticated/preferences")({
  validateSearch: (search: Record<string, unknown>): PrefSearch =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
  head: () => ({
    meta: [
      { title: "تفضيلاتي | SyndeoCare" },
      {
        name: "description",
        content: "تنبيهات الوظائف الجديدة وإعدادات التنبيهات والتقرير الشهري لنشاطك على SyndeoCare.",
      },
      { property: "og:title", content: "تفضيلاتي | SyndeoCare" },
      { property: "og:description", content: "اضبط تنبيهات الوظائف وتابع تقريرك الشهري." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PreferencesPage,
});

const TXT = {
  ar: {
    title: "تفضيلاتي",
    sub: "اضبط تنبيهات الوظائف الجديدة وتابع تقريرك الشهري.",
    tabAlerts: "تنبيهات الوظائف",
    tabReport: "التقرير الشهري",
    newTitle: "وظائف جديدة تطابق تنبيهاتك",
    newBody: (n: number) =>
      n === 0
        ? "لا توجد وظائف جديدة مطابقة خلال آخر 7 أيام."
        : `${n} وظيفة جديدة مطابقة خلال آخر 7 أيام.`,
    noAlerts: "أنشئ تنبيهاً أولاً لنعرض لك الوظائف الجديدة المطابقة.",
    open: "عرض الوظائف",
    facilityTitle: "هذه الصفحة للكوادر الصحية",
    facilityBody: "حسابك حساب منشأة — إدارة إعلاناتك والمرشحين تتم من لوحة المنشأة.",
    facilityCta: "فتح لوحة المنشأة",
  },
  en: {
    title: "My preferences",
    sub: "Tune your job alerts and follow your monthly activity report.",
    tabAlerts: "Job alerts",
    tabReport: "Monthly report",
    newTitle: "New jobs matching your alerts",
    newBody: (n: number) =>
      n === 0
        ? "No new matching jobs in the last 7 days."
        : `${n} new matching job(s) in the last 7 days.`,
    noAlerts: "Create an alert first so we can show matching new jobs.",
    open: "View jobs",
    facilityTitle: "This page is for healthcare professionals",
    facilityBody: "Your account is a facility — manage listings and candidates from the facility dashboard.",
    facilityCta: "Open facility dashboard",
  },
} as const;

function PreferencesPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const navigate = useNavigate();
  const tab = Route.useSearch().tab ?? "alerts";

  if (roles?.includes("facility")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Building2 className="mx-auto size-8 text-primary" />
          <h1 className="mt-3 font-display text-xl font-extrabold">{c.facilityTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.facilityBody}</p>
          <Button className="mt-4" asChild>
            <Link to="/facility">{c.facilityCta}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-muted-foreground">{c.sub}</p>

      <NewMatchesCard />

      <Tabs
        value={tab}
        onValueChange={(v) => void navigate({ to: "/preferences", search: { tab: v }, replace: true })}
        className="mt-6"
      >
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="alerts" className="shrink-0">{c.tabAlerts}</TabsTrigger>
            <TabsTrigger value="report" className="shrink-0">{c.tabReport}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="alerts" className="mt-6">
          <AlertsPanel />
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <ApplicantReportPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** عدد الوظائف الجديدة (آخر 7 أيام) المطابقة لتنبيهات الكادر النشطة. */
function NewMatchesCard() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();

  const { data } = useQuery({
    queryKey: ["alert-matches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: alerts, error } = await supabase
        .from("job_alerts")
        .select("specialty_id,country,city,employment_type")
        .eq("user_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;
      if (!alerts?.length) return { alerts: 0, matches: 0 };

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id,specialty_id,country,city,employment_type")
        .eq("is_active", true)
        .gte("created_at", since);
      if (jobsError) throw jobsError;

      const matches = (jobs ?? []).filter((j) =>
        alerts.some(
          (a) =>
            (!a.specialty_id || a.specialty_id === j.specialty_id) &&
            (!a.country || a.country === j.country) &&
            (!a.city || a.city.trim() === j.city) &&
            (!a.employment_type || a.employment_type === j.employment_type),
        ),
      ).length;
      return { alerts: alerts.length, matches };
    },
  });

  if (!data) return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BellRing className="size-5 text-primary" />
        <h2 className="font-bold">{c.newTitle}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.alerts === 0 ? c.noAlerts : c.newBody(data.matches)}
      </p>
      {data.matches > 0 && (
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/jobs">
            <Briefcase className="size-4" /> {c.open}
          </Link>
        </Button>
      )}
    </section>
  );
}
