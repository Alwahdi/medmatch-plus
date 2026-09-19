import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Briefcase, Globe } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertsPanel } from "@/components/panels/alerts";
import { NotificationsPanel } from "@/components/panels/notifications";
import { SecurityPanel } from "@/components/panels/security";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { ErrorState } from "@/components/error-state";
import { useLang } from "@/lib/i18n";
import { WorkspaceHeading } from "@/components/workspace-ui";

type SettingsTab = "general" | "alerts" | "notifications" | "security";
type SettingsSearch = { tab?: SettingsTab };

const TABS: readonly SettingsTab[] = ["general", "alerts", "notifications", "security"];

export const Route = createFileRoute("/_authenticated/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    const tab = search["tab"];
    return typeof tab === "string" && (TABS as readonly string[]).includes(tab)
      ? { tab: tab as SettingsTab }
      : {};
  },
  head: () => ({
    meta: [
      { title: "الإعدادات | SyndeoCare" },
      {
        name: "description",
        content: "مكان واحد للغة الواجهة وتنبيهات الوظائف والإشعارات وأمان الحساب في SyndeoCare.",
      },
      { property: "og:title", content: "الإعدادات | SyndeoCare" },
      { property: "og:description", content: "اللغة والتنبيهات والإشعارات والأمان في صفحة واحدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const TXT = {
  ar: {
    title: "الإعدادات",
    sub: "اللغة والتنبيهات والإشعارات وأمان الحساب — كلها هنا.",
    tabGeneral: "عام",
    tabAlerts: "تنبيهات الوظائف",
    tabNotifications: "الإشعارات",
    tabSecurity: "الأمان",
    langTitle: "لغة الواجهة",
    langBody: "اختر لغة عرض المنصة، يتم الحفظ تلقائياً على هذا الجهاز.",
    arabic: "العربية",
    english: "English",
    signedInAs: "مسجّل الدخول باسم",
    newTitle: "وظائف جديدة تطابق تنبيهاتك",
    newBody: (n: number) =>
      n === 0
        ? "لا توجد وظائف جديدة مطابقة خلال آخر 7 أيام."
        : `${n} وظيفة جديدة مطابقة خلال آخر 7 أيام.`,
    noAlerts: "أنشئ تنبيهاً أولاً لنعرض لك الوظائف الجديدة المطابقة.",
    open: "عرض الوظائف",
  },
  en: {
    title: "Settings",
    sub: "Language, job alerts, notifications and account security — all in one place.",
    tabGeneral: "General",
    tabAlerts: "Job alerts",
    tabNotifications: "Notifications",
    tabSecurity: "Security",
    langTitle: "Interface language",
    langBody: "Pick the platform language. Saved automatically on this device.",
    arabic: "العربية",
    english: "English",
    signedInAs: "Signed in as",
    newTitle: "New jobs matching your alerts",
    newBody: (n: number) =>
      n === 0
        ? "No new matching jobs in the last 7 days."
        : `${n} new matching job(s) in the last 7 days.`,
    noAlerts: "Create an alert first so we can show matching new jobs.",
    open: "View jobs",
  },
} as const;

function SettingsPage() {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const { lang, setLang } = useLang();
  const c = TXT[lang];
  const navigate = useNavigate();
  const isFacility = roles?.includes("facility");
  const requested = Route.useSearch().tab ?? "general";
  const tab = requested === "alerts" && isFacility ? "general" : requested;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <WorkspaceHeading title={c.title} description={c.sub} />

      <Tabs
        value={tab}
        onValueChange={(v) =>
          void navigate({ to: "/settings", search: { tab: v as SettingsTab }, replace: true })
        }
        className="mt-6"
      >
        <div className="-mx-4 overflow-x-auto border-x border-transparent px-4 pb-2 [scrollbar-width:thin]">
          <TabsList className="w-max">
            <TabsTrigger value="general" className="shrink-0">{c.tabGeneral}</TabsTrigger>
            {!isFacility && (
              <TabsTrigger value="alerts" className="shrink-0">{c.tabAlerts}</TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="shrink-0">{c.tabNotifications}</TabsTrigger>
            <TabsTrigger value="security" className="shrink-0">{c.tabSecurity}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-6">
          <section className="rounded-lg border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              <h2 className="font-bold">{c.langTitle}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{c.langBody}</p>
            <div className="mt-4 flex gap-2">
              <Button variant={lang === "ar" ? "default" : "outline"} onClick={() => setLang("ar")}>
                {c.arabic}
              </Button>
              <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
                {c.english}
              </Button>
            </div>
          </section>

          <p className="mt-4 text-xs text-muted-foreground">
            {c.signedInAs} {user?.email}
          </p>
        </TabsContent>

        {!isFacility && (
          <TabsContent value="alerts" className="mt-6">
            <NewMatchesCard />
            <div className="mt-4">
              <AlertsPanel />
            </div>
          </TabsContent>
        )}

        <TabsContent value="notifications" className="mt-6">
          <NotificationsPanel embedded />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityPanel embedded />
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

  const { data, isLoading, isError, error, refetch } = useQuery({
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
        .from("public_jobs")
        .select("id,specialty_id,country,city,employment_type")
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

  if (isLoading)
    return (
      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-muted" />
      </section>
    );

  if (isError)
    return <ErrorState error={error} onRetry={() => void refetch()} className="py-8" />;

  if (!data) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-card">
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
