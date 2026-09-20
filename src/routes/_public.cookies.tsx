import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { canonical, shareMeta } from "@/lib/seo";

const TXT = {
  ar: {
    badge: "الشفافية",
    title: "التخزين في المتصفح وملفات الارتباط",
    sub: "نشرح هنا ما يحفظه متصفحك أثناء استخدام المنصة ولماذا، وكيف يمكنك التحكم به.",
    updated: "آخر تحديث: سبتمبر 2026",
    sections: [
      {
        h: "ما المقصود بالتخزين في المتصفح؟",
        p: [
          "بيانات صغيرة يحفظها متصفحك عند زيارة الموقع، سواء في مساحة التخزين المحلية أو تخزين الجلسة أو ملفات الارتباط.",
          "نستخدمها لإبقائك مسجّل الدخول ولتذكّر لغتك المفضلة.",
        ],
      },
      {
        h: "ما الذي نستخدمه؟",
        p: [
          "تخزين أساسي للجلسة: للحفاظ على تسجيل الدخول وحماية الحساب، إضافة إلى أي ملفات ارتباط ضرورية تفرضها بنية المصادقة. لا يعمل الموقع بدونها.",
          "تفضيل اللغة: يُحفظ محلياً في متصفحك لتذكّر اختيارك بين العربية والإنجليزية.",
        ],
      },
      {
        h: "ما الذي لا نفعله",
        p: [
          "لا نستخدم أدوات تحليلات أو قياس أداء داخل المنصة.",
          "لا نبيع بياناتك ولا نشاركها مع معلنين خارجيين.",
          "لا نتتبعك عبر مواقع أخرى.",
        ],
      },
      {
        h: "كيف تتحكم به؟",
        p: [
          "يمكنك حذف بيانات الموقع وملفات الارتباط أو منعها من إعدادات متصفحك في أي وقت.",
          "منع التخزين الأساسي سيمنعك من تسجيل الدخول واستخدام لوحة التحكم.",
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
    title: "Browser storage & cookies",
    sub: "Here we explain what your browser stores while you use the platform, why, and how you can control it.",
    updated: "Last updated: September 2026",
    sections: [
      {
        h: "What is browser storage?",
        p: [
          "Small pieces of data your browser keeps when you visit the site — in local storage, session storage, or cookies.",
          "We use it to keep you signed in and to remember your preferred language.",
        ],
      },
      {
        h: "What we use",
        p: [
          "Essential session storage: keeping you signed in and protecting your account, plus any essential cookies required by the authentication infrastructure. The site cannot work without it.",
          "Language preference: stored locally in your browser so we remember your choice between Arabic and English.",
        ],
      },
      {
        h: "What we don't do",
        p: [
          "We run no analytics or performance-measurement tools in the product.",
          "We don't sell your data and we don't share it with external advertisers.",
          "We don't track you across other websites.",
        ],
      },
      {
        h: "How to control it",
        p: [
          "You can delete or block site data and cookies from your browser settings at any time.",
          "Blocking essential storage will prevent you from signing in and using the dashboard.",
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
      { title: "التخزين في المتصفح وملفات الارتباط | Browser Storage & Cookies | SyndeoCare" },
      {
        name: "description",
        content: "ما الذي يحفظه متصفحك أثناء استخدام SyndeoCare ولماذا، وكيف تتحكم به.",
      },
      { property: "og:title", content: "التخزين في المتصفح وملفات الارتباط | SyndeoCare" },
      { property: "og:description", content: "تفاصيل التخزين في المتصفح وملفات الارتباط على منصة SyndeoCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      ...shareMeta("/cookies"),
    ],
  links: canonical("/cookies"),
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
