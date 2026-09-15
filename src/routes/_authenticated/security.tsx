import { createFileRoute } from "@tanstack/react-router";
import { SecurityPanel } from "@/components/panels/security";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({
    meta: [
      { title: "الأمان وتسجيل الدخول | SyndeoCare" },
      {
        name: "description",
        content:
          "غيّر كلمة المرور، اربط حساب جوجل، فعّل التحقق بخطوتين والبصمة، وراجع جلسات الدخول النشطة.",
      },
      { property: "og:title", content: "الأمان وتسجيل الدخول | SyndeoCare" },
      {
        property: "og:description",
        content: "إدارة كلمة المرور والحسابات المرتبطة والتحقق بخطوتين وجلسات الدخول.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityPage,
});


function SecurityPage() {
  return <SecurityPanel />;
}
