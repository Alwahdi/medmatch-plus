import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, BookOpen, ArrowLeft } from "lucide-react";
import { GUIDES } from "@/content/guides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    badge: "محتوى مهني عملي",
    title: "الأدلة والمقالات",
    sub: "إرشادات عملية مبنية على ما تبحث عنه المنشآت فعلاً في الكوادر الصحية.",
    label: "أحدث المنشورات",
    heading: "أدلة المهن الطبية",
    browseJobs: "تصفح الوظائف",
    readMinutes: (n: number) => `قراءة ${n} دقائق`,
  },
  en: {
    badge: "Practical career content",
    title: "Guides and articles",
    sub: "Practical guidance based on what healthcare employers actually look for in candidates.",
    label: "Latest posts",
    heading: "Medical career guides",
    browseJobs: "Browse jobs",
    readMinutes: (n: number) => `${n} min read`,
  },
} as const;

// English translations for guide cards, keyed by slug (content data lives in src/content/guides.ts)
const GUIDE_EN: Record<string, { title: string; description: string; category: string }> = {
  "medical-cv-ats": {
    title: "How to write a medical CV that passes ATS systems",
    description:
      "A practical guide to writing a healthcare CV that gets through automated screening systems and reaches the hiring manager.",
    category: "Resume",
  },
  "license-verification-gulf": {
    title: "Professional license verification: what you need before applying",
    description:
      "The documents required to verify your professional license, and how to prepare them in advance to speed up your application.",
    category: "Licensing",
  },
  "locum-shifts-guide": {
    title: "A guide to locum shift work for healthcare professionals",
    description:
      "How to choose the right shifts, calculate your real hourly pay, and build a reputation that keeps facilities booking you.",
    category: "Shifts",
  },
  "salary-negotiation-health": {
    title: "Negotiating your salary in the healthcare sector",
    description: "How to set a fair range, when to negotiate, and what beyond salary can be negotiated.",
    category: "Career path",
  },
};

export const Route = createFileRoute("/_public/guides/")({
  head: () => ({
    meta: [
      { title: "أدلة المسار المهني الصحي | SyndeoCare" },
      {
        name: "description",
        content:
          "أدلة عملية للكوادر الصحية: كتابة سيرة ذاتية تجتاز ATS، توثيق التراخيص، العمل بالمناوبات، والتفاوض على الراتب.",
      },
      { property: "og:title", content: "أدلة المسار المهني الصحي | SyndeoCare" },
      { property: "og:description", content: "محتوى عملي يساعدك على الحصول على الوظيفة الصحية المناسبة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuidesIndex,
});

function GuidesIndex() {
  const { lang } = useLang();
  const c = TXT[lang];

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <BookOpen className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            {c.sub}
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">{c.label}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">{c.heading}</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/jobs">
                {c.browseJobs} <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((g) => {
              const en = GUIDE_EN[g.slug];
              const title = lang === "en" && en ? en.title : g.title;
              const description = lang === "en" && en ? en.description : g.description;
              const category = lang === "en" && en ? en.category : g.category;
              return (
                <Link
                  key={g.slug}
                  to="/guides/$slug"
                  params={{ slug: g.slug }}
                  className="card-lift rounded-lg border border-border bg-card p-6 hover:border-accent/30"
                >
                  <Badge variant="secondary">{category}</Badge>
                  <h2 className="mt-3 font-display text-xl font-bold">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                  <span className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {c.readMinutes(g.readMinutes)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
