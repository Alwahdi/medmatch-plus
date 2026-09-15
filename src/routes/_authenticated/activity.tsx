import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationsPanel } from "@/components/panels/applications";
import { MyShiftsPanel } from "@/components/panels/my-shifts";
import { SavedPanel } from "@/components/panels/saved";
import { useLang } from "@/lib/i18n";
import { WorkspaceHeading } from "@/components/workspace-ui";

type ActivityTab = "applications" | "shifts" | "saved";
type ActivitySearch = { tab?: ActivityTab };

export const Route = createFileRoute("/_authenticated/activity")({
  validateSearch: (search: Record<string, unknown>): ActivitySearch => {
    const tab = search["tab"];
    return tab === "applications" || tab === "shifts" || tab === "saved" ? { tab } : {};
  },
  head: () => ({
    meta: [
      { title: "نشاطي | SyndeoCare" },
      { name: "description", content: "طلباتك ومناوباتك المحجوزة والوظائف المحفوظة في مكان واحد." },
      { property: "og:title", content: "نشاطي | SyndeoCare" },
      { property: "og:description", content: "متابعة الطلبات والمناوبات والمحفوظات." },
    ],
  }),
  component: ActivityPage,
});

const TXT = {
  ar: { title: "نشاطي", sub: "تابع طلباتك وحجوزاتك والأعمال التي حفظتها.", applications: "طلباتي", shifts: "مناوباتي", saved: "المحفوظات" },
  en: { title: "My activity", sub: "Track applications, shift bookings and saved work.", applications: "Applications", shifts: "My shifts", saved: "Saved" },
} as const;

function ActivityPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const tab = Route.useSearch().tab ?? "applications";
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <WorkspaceHeading title={c.title} description={c.sub} />
      <Tabs
        value={tab}
        onValueChange={(v) => void navigate({ to: "/activity", search: { tab: v as ActivityTab }, replace: true })}
      >
        <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="applications" className="shrink-0">{c.applications}</TabsTrigger>
            <TabsTrigger value="shifts" className="shrink-0">{c.shifts}</TabsTrigger>
            <TabsTrigger value="saved" className="shrink-0">{c.saved}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="applications" className="mt-5">
          <ApplicationsPanel />
        </TabsContent>
        <TabsContent value="shifts" className="mt-5">
          <MyShiftsPanel />
        </TabsContent>
        <TabsContent value="saved" className="mt-5">
          <SavedPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
