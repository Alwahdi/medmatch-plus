import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPanel } from "@/components/panels/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | SyndeoCare" },
      { name: "description", content: "كل إشعارات حسابك في SyndeoCare: الرسائل، الدعوات، الطلبات والتوثيق." },
      { property: "og:title", content: "الإشعارات | SyndeoCare" },
      { property: "og:description", content: "تابع إشعارات حسابك على منصة SyndeoCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});


function NotificationsPage() {
  return <NotificationsPanel />;
}
