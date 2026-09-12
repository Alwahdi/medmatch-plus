import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { QUESTION_BANKS } from "@/content/question-banks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/interview-questions/")({
  head: () => ({
    meta: [
      { title: "بنوك أسئلة المقابلات الطبية | SyndeoCare" },
      {
        name: "description",
        content:
          "أسئلة مقابلات التمريض والأطباء والصيدلة والمهن المساندة، مع إرشادات للإجابة النموذجية.",
      },
      { property: "og:title", content: "بنوك أسئلة المقابلات الطبية | SyndeoCare" },
      { property: "og:description", content: "استعد لمقابلتك القادمة بأسئلة حقيقية وإرشادات إجابة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BanksIndex,
});

function BanksIndex() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <HelpCircle className="size-4" />
            استعد لمقابلتك القادمة
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">
            بنوك أسئلة المقابلات
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            أسئلة متكررة في مقابلات القطاع الصحي، مع ما يبحث عنه المُقابِل في كل إجابة.
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">حسب المهنة</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">اختر تخصصك</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/jobs">
                تصفح الوظائف <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {QUESTION_BANKS.map((b) => {
              const count = b.groups.reduce((n, g) => n + g.questions.length, 0);
              return (
                <Link
                  key={b.slug}
                  to="/interview-questions/$slug"
                  params={{ slug: b.slug }}
                  className="card-lift rounded-2xl border border-border bg-card p-6 hover:border-accent/30"
                >
                  <h2 className="font-display text-xl font-bold">{b.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>
                  <span className="mt-4 block text-xs text-muted-foreground">{count} سؤالاً</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
