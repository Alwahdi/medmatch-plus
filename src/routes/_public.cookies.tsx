import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    badge: "الشفافية",
    title: "ملفات الارتباط (Cookies)",
    sub: "نشرح هنا ما نستخدمه من ملفات ارتباط ولماذا، وكيف يمكنك التحكم بها.",
    updated: "آخر تحديث: سبتمبر 2026",
    sections: [
      {
        h: "ما هي ملفات الارتباط؟",
        p: [
          "ملفات صغيرة يحفظها متصفحك عند زيارة الموقع، تساعدنا على تذكّر تسجيل دخولك ولغتك المفضلة.",
        ],
      },
      {
        h: "ما الذي نستخدمه؟",
        p: [
          "ملفات ضرورية: لتسجيل الدخول وحفظ الجلسة وحماية الحساب. لا يعمل الموقع بدونها.",
          "ملفات التفضيلات: لتذكّر اللغة (عربي/إنجليزي) وبعض خيارات العرض.",
          "قياس الأداء: إحصاءات مجمّعة عن الصفحات الأكثر زيارة، دون ربطها بهويتك.",
        ],
      },
      {
        h: "ما الذي لا نفعله",
        p: [
          "لا نبيع بياناتك ولا نشارك ملفات الارتباط مع معلنين خارجيين.",
          "لا نستخدم ملفات ارتباط لتتبعك عبر مواقع أخرى.",
        ],
      },
      {
        h: "كيف تتحكم بها؟",
        p: [
          "يمكنك حذف ملفات الارتباط أو منعها من إعدادات متصفحك في أي وقت.",
          "منع الملفات الضرورية سيمنعك من تسجيل الدخول واستخدام لوحة التحكم.",
        ],
      },
    ],
    contactTitle: "لديك سؤال؟",
    contactSub: "تواصل معنا وسنوضح لك أي تفصيل يخص بياناتك.",
    contact: "تواصل معنا",
    privacy: "سياسة الخصوصية",
  },
  en: {
    badge: "Transparency",
    title: "Cookies",
    sub: "Here we explain which cookies we use, why, and how you can control them.",
    updated: "Last updated: September 2026",
    sections: [
      {
        h: "What are cookies?",
        p: [
          "Small files your browser stores when you visit the site; they help us remember your sign-in and preferred language.",
        ],
      },
      {
        h: "What we use",
        p: [
          "Essential cookies: sign-in, session storage and account protection. The site cannot work without them.",
          "Preference cookies: remembering your language (Arabic/English) and some display options.",
          "Performance measurement: aggregated statistics about the most visited pages, not linked to your identity.",
        ],
      },
      {
        h: "What we don't do",
        p: [
          "We don't sell your data and we don't share cookies with external advertisers.",
          "We don't use cookies to track you across other websites.",
        ],
      },
      {
        h: "How to control them",
        p: [
          "You can delete or block cookies from your browser settings at any time.",
          "Blocking essential cookies will prevent you from signing in and using the dashboard.",
        ],
      },
    ],
    contactTitle: "Have a question?",
    contactSub: "Contact us and we'll clarify any detail about your data.",
    contact: "Contact us",
    privacy: "Privacy policy",
  },
} as const;

export const Route = createFileRoute("/_public/cookies")({
  head: () => ({
    meta: [
      { title: "سياسة ملفات الارتباط | SyndeoCare" },
      {
        name: "description",
        content: "ما هي ملفات الارتباط التي تستخدمها SyndeoCare ولماذا، وكيف تتحكم بها من متصفحك.",
      },
      { property: "og:title", content: "سياسة ملفات الارتباط | SyndeoCare" },
      { property: "og:description", content: "تفاصيل استخدام ملفات الارتباط على منصة SyndeoCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  const { lang } = useLang();
  const c = TXT[lang];

  return (
    <>
      <section className="page-hero py-14">
        <div className="mx-auto max-w-3xl px-4">
          <span className="section-label">{c.badge}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">{c.title}</h1>
          <p className="mt-3 text-on-hero/85">{c.sub}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">{c.updated}</p>
        {c.sections.map((section) => (
          <section key={section.h} className="mt-8">
            <h2 className="font-display text-xl font-bold">{section.h}</h2>
            {section.p.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <div className="card-lift mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">{c.contactTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.contactSub}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/contact">{c.contact}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/privacy">{c.privacy}</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
