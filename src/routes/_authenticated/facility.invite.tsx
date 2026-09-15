import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { InvitePanel, INVITE_TXT } from "@/components/panels/invite";

type InviteSearch = { job: string | undefined; shift: string | undefined };

export const Route = createFileRoute("/_authenticated/facility/invite")({
  validateSearch: (search: Record<string, unknown>): InviteSearch => ({
    job: typeof search["job"] === "string" ? (search["job"] as string) : undefined,
    shift: typeof search["shift"] === "string" ? (search["shift"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "دعوة مختصين | SyndeoCare" },
      {
        name: "description",
        content: "ابحث عن كوادر طبية وادعُهم مباشرة للتقديم على وظيفتك أو مناوبتك داخل SyndeoCare.",
      },
      { property: "og:title", content: "دعوة مختصين | SyndeoCare" },
      { property: "og:description", content: "دعوات مباشرة للكوادر الطبية للوظائف والمناوبات." },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { lang } = useLang();
  const c = INVITE_TXT[lang];
  const { job: jobId, shift: shiftId } = Route.useSearch();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.subtitle}</p>
        </div>
        <Link to="/facility" className="text-sm text-primary underline">{c.back}</Link>
      </div>
      <div className="mt-6">
        <InvitePanel jobId={jobId} shiftId={shiftId} />
      </div>
    </div>
  );
}
