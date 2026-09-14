import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertsPanel } from "@/components/panels/alerts";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  Globe,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

type SettingsSearch = { tab: string };

export const Route = createFileRoute("/_authenticated/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    tab: typeof search.tab === "string" ? search.tab : "general",
  }),
  head: () => ({
    meta: [
      { title: "الإعدادات | SyndeoCare" },
      { name: "description", content: "إدارة لغة الواجهة والإشعارات والحساب في منصة SyndeoCare." },
      { property: "og:title", content: "الإعدادات | SyndeoCare" },
      { property: "og:description", content: "غيّر لغة الواجهة وتحكّم بإشعارات حسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const TXT = {
  ar: {
    title: "الإعدادات",
    sub: "تحكّم بلغة الواجهة والإشعارات وحسابك",
    langTitle: "لغة الواجهة",
    langBody: "اختر لغة عرض المنصة، يتم الحفظ تلقائياً على هذا الجهاز.",
    arabic: "العربية",
    english: "English",
    notifTitle: "الإشعارات",
    notifBody: "شاهد كل إشعارات حسابك: الرسائل، الدعوات، الطلبات، التوثيق.",
    notifCta: "فتح الإشعارات",
    alertsTitle: "تنبيهات الوظائف",
    alertsBody: "حدّد التخصص والمدينة وطريقة التنبيه (بريد/واتساب).",
    alertsCta: "إدارة التنبيهات",
    accountTitle: "الحساب",
    profile: "ملفي الشخصي",
    facility: "ملف المنشأة",
    credentials: "التوثيق والمستندات",
    signOut: "تسجيل الخروج",
    signedInAs: "مسجّل الدخول باسم",
    security: "الأمان وتسجيل الدخول",
  },
  en: {
    title: "Settings",
    sub: "Control your interface language, notifications and account",
    langTitle: "Interface language",
    langBody: "Pick the platform language. Saved automatically on this device.",
    arabic: "العربية",
    english: "English",
    notifTitle: "Notifications",
    notifBody: "See all account notifications: messages, invitations, applications, verification.",
    notifCta: "Open notifications",
    alertsTitle: "Job alerts",
    alertsBody: "Choose specialty, city and delivery channel (email / WhatsApp).",
    alertsCta: "Manage alerts",
    accountTitle: "Account",
    profile: "My profile",
    facility: "Facility profile",
    credentials: "Documents & verification",
    signOut: "Sign out",
    signedInAs: "Signed in as",
    security: "Security & sign-in",
  },
} as const;

function SettingsPage() {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const { lang, setLang } = useLang();
  const c = TXT[lang];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFacility = roles?.includes("facility");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-muted-foreground">{c.sub}</p>

      <Tabs
        value={tab}
        onValueChange={(v) => void navigate({ to: "/settings", search: { tab: v }, replace: true })}
        className="mt-6"
      >
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="general" className="shrink-0">
              {lang === "ar" ? "عام" : "General"}
            </TabsTrigger>
            {!isFacility && (
              <TabsTrigger value="alerts" className="shrink-0">
                {lang === "ar" ? "تنبيهات الوظائف" : "Job alerts"}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {!isFacility && (
          <TabsContent value="alerts" className="mt-6">
            <AlertsPanel />
          </TabsContent>
        )}

        <TabsContent value="general" className="mt-0">


      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
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

      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <h2 className="font-bold">{c.notifTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.notifBody}</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/notifications">{c.notifCta}</Link>
        </Button>
      </section>

      {!isFacility && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            <h2 className="font-bold">{c.alertsTitle}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{c.alertsBody}</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/alerts">{c.alertsCta}</Link>
          </Button>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold">{c.accountTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.signedInAs} {user?.email}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {isFacility ? (
            <Button variant="outline" asChild>
              <Link to="/facility/profile">
                <Building2 className="size-4" /> {c.facility}
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/profile">
                  <UserRound className="size-4" /> {c.profile}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/credentials">
                  <ShieldCheck className="size-4" /> {c.credentials}
                </Link>
              </Button>
            </>
          )}
          <Button variant="outline" asChild>
            <Link to="/security">
              <Lock className="size-4" /> {c.security}
            </Link>
          </Button>
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="size-4" /> {c.signOut}
          </Button>
        </div>
      </section>
        </TabsContent>
      </Tabs>
    </div>

  );
}
