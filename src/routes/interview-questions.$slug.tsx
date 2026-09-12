import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getBank } from "@/content/question-banks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/interview-questions/$slug")({
  loader: ({ params }) => {
    const bank = getBank(params.slug);
    if (!bank) throw notFound();
    return bank;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | SyndeoCare` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary" },
        ]
      : [{ title: "أسئلة المقابلات | SyndeoCare" }],
  }),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">تعذّر تحميل الصفحة</h1>
      <Button className="mt-6" asChild>
        <Link to="/interview-questions">العودة لبنوك الأسئلة</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">بنك الأسئلة غير موجود</h1>
      <Button className="mt-6" asChild>
        <Link to="/interview-questions">تصفح بنوك الأسئلة</Link>
      </Button>
    </div>
  ),
  component: BankPage,
});

function BankPage() {
  const bank = Route.useLoaderData();
  return (
    <section className="py-14">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          to="/interview-questions"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4" /> كل بنوك الأسئلة
        </Link>
        <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">{bank.title}</h1>
        <p className="mt-3 text-muted-foreground">{bank.description}</p>

        <div className="mt-10 space-y-10">
          {bank.groups.map((g) => (
            <div key={g.heading}>
              <h2 className="font-display text-xl font-bold">{g.heading}</h2>
              <div className="mt-4 space-y-4">
                {g.questions.map((q) => (
                  <div key={q.q} className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-bold">{q.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">كيف تجيب: </span>
                      {q.hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center">
          <h2 className="font-display text-xl font-extrabold">استعد بالتقديم الفعلي</h2>
          <p className="mt-2 text-sm text-muted-foreground">تصفح الفرص المتاحة الآن في تخصصك.</p>
          <Button className="mt-5" asChild>
            <Link to="/jobs">تصفح الوظائف</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
