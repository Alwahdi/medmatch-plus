import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { QUESTION_BANKS } from "@/content/question-banks";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    badge: "استعد لمقابلتك القادمة",
    title: "بنوك أسئلة المقابلات",
    sub: "أسئلة متكررة في مقابلات القطاع الصحي، مع ما يبحث عنه المُقابِل في كل إجابة.",
    byRole: "حسب المهنة",
    chooseSpecialty: "اختر تخصصك",
    browseJobs: "تصفح الوظائف",
    questionsCount: (n: number) => `${n} سؤالاً`,
  },
  en: {
    badge: "Get ready for your next interview",
    title: "Interview question banks",
    sub: "Frequently asked questions in healthcare interviews, with what interviewers look for in each answer.",
    byRole: "By role",
    chooseSpecialty: "Choose your specialty",
    browseJobs: "Browse jobs",
    questionsCount: (n: number) => `${n} questions`,
  },
} as const;

// English translations for bank cards, keyed by slug (Arabic source lives in src/content/question-banks.ts)
const BANK_EN: Record<string, { title: string; description: string }> = {
  nursing: {
    title: "Nursing interview questions",
    description: "Frequently asked nursing interview questions with guidance for model answers.",
  },
  physicians: {
    title: "Physician interview questions",
    description: "Common questions for residents and specialists, with what interviewers look for.",
  },
  pharmacy: {
    title: "Pharmacy interview questions",
    description: "Questions for hospital and community pharmacists.",
  },
  "allied-health": {
    title: "Allied health interview questions",
    description: "For lab, radiology, physiotherapy and technician roles.",
  },
};

export const Route = createFileRoute("/_public/interview-questions/")({
  head: () => ({
    meta: [
      { title: "بنوك أسئلة المقابلات الطبية | Medical interview question banks | SyndeoCare" },
      {
        name: "description",
        content:
          "أسئلة مقابلات التمريض والأطباء والصيدلة والمهن المساندة، مع إرشادات للإجابة النموذجية.",
      },
      { property: "og:title", content: "بنوك أسئلة المقابلات الطبية | Medical interview question banks | SyndeoCare" },
      { property: "og:description", content: "استعد لمقابلتك القادمة بأسئلة حقيقية وإرشادات إجابة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BanksIndex,
});

function BanksIndex() {
  const { lang } = useLang();
  const c = TXT[lang];

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <HelpCircle className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-on-hero/85">
            {c.sub}
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">{c.byRole}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">{c.chooseSpecialty}</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/jobs">
                {c.browseJobs} <ArrowLeft className="size-4 ltr:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {QUESTION_BANKS.map((b) => {
              const count = b.groups.reduce((n, g) => n + g.questions.length, 0);
              const en = BANK_EN[b.slug];
              const title = lang === "en" && en ? en.title : b.title;
              const description = lang === "en" && en ? en.description : b.description;
              return (
                <Link
                  key={b.slug}
                  to="/interview-questions/$slug"
                  params={{ slug: b.slug }}
                  className="card-lift rounded-lg border border-border bg-card p-6 hover:border-accent/30"
                >
                  <h2 className="font-display text-xl font-bold">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                  <span className="mt-4 block text-xs text-muted-foreground">{c.questionsCount(count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
