import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { WorkspaceHeading } from "@/components/workspace-ui";

type SettingsSearch = { tab?: string };

export const Route = createFileRoute("/_authenticated/settings")({
  beforeLoad: ({ search }) => {
    // التنبيهات انتقلت لصفحة التفضيلات — نحافظ على الروابط القديمة.
    if (search.tab === "alerts") throw redirect({ to: "/preferences", search: { tab: "alerts" } });
  },
  validateSearch: (search: Record<string, unknown>): SettingsSearch =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
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
     notifBody: "شاهد إشعارات الدعوات والطلبات والتوثيق. الرسائل لها عداد مستقل.",
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
     notifBody: "See invitation, application and verification updates. Messages have their own counter.",
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
  const isFacility = roles?.includes("facility");
  const tab = Route.useSearch().tab ?? "general";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <WorkspaceHeading title={c.title} description={c.sub} />

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
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-0">


      <section className="mt-6 rounded-lg border border-border bg-card p-5 shadow-card">
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

      <section className="mt-4 rounded-lg border border-border bg-card p-5 shadow-card">
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
        <section className="mt-4 rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <h2 className="font-bold">{c.alertsTitle}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{c.alertsBody}</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/preferences" search={{ tab: "alerts" }}>{c.alertsCta}</Link>
          </Button>
        </section>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {c.signedInAs} {user?.email}
      </p>
        </TabsContent>
      </Tabs>
    </div>

  );
}
