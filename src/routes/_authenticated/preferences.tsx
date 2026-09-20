import { createFileRoute, redirect } from "@tanstack/react-router";

/** التفضيلات اندمجت: التنبيهات في الإعدادات، والتقرير الشهري في نشاطي. */
export const Route = createFileRoute("/_authenticated/preferences")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
  beforeLoad: ({ search }) => {
    if (search.tab === "report") throw redirect({ to: "/activity", search: { tab: "report" }, replace: true });
    throw redirect({ to: "/settings", search: { tab: "alerts" }, replace: true });
  },
});
