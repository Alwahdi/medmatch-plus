import { createFileRoute, Link } from "@tanstack/react-router";
import { QUESTION_BANKS } from "@/content/question-banks";

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
    <section className="py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">بنوك أسئلة المقابلات</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          أسئلة متكررة في مقابلات القطاع الصحي، مع ما يبحث عنه المُقابِل في كل إجابة.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {QUESTION_BANKS.map((b) => {
            const count = b.groups.reduce((n, g) => n + g.questions.length, 0);
            return (
              <Link
                key={b.slug}
                to="/interview-questions/$slug"
                params={{ slug: b.slug }}
                className="card-lift rounded-2xl border border-border bg-card p-6"
              >
                <h2 className="font-display text-xl font-bold">{b.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.description}</p>
                <span className="mt-4 block text-xs text-muted-foreground">{count} سؤالاً</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
