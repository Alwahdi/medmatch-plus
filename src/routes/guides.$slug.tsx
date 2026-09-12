import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { GUIDES, getGuide } from "@/content/guides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = getGuide(params.slug);
    if (!guide) throw notFound();
    return guide;
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
      : [{ title: "دليل | SyndeoCare" }],
  }),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">تعذّر تحميل الدليل</h1>
      <Button className="mt-6" asChild>
        <Link to="/guides">العودة للأدلة</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">هذا الدليل غير موجود</h1>
      <Button className="mt-6" asChild>
        <Link to="/guides">تصفح كل الأدلة</Link>
      </Button>
    </div>
  ),
  component: GuidePage,
});

function GuidePage() {
  const guide = Route.useLoaderData();
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <article className="py-14">
      <div className="mx-auto max-w-3xl px-4">
        <Link to="/guides" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-4" /> كل الأدلة
        </Link>
        <Badge variant="secondary" className="mt-5">{guide.category}</Badge>
        <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">{guide.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{guide.description}</p>
        <span className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> قراءة {guide.readMinutes} دقائق
        </span>

        <div className="mt-10 space-y-8">
          {guide.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-xl font-bold">{s.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center">
          <h2 className="font-display text-xl font-extrabold">جاهز تطبّق ما قرأت؟</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            أنشئ ملفك المهني مجاناً وابدأ التقديم على الوظائف والمناوبات.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>إنشاء ملف مهني</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jobs">تصفح الوظائف</Link>
            </Button>
          </div>
        </div>

        {others.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold">أدلة أخرى</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {others.map((g) => (
                <Link
                  key={g.slug}
                  to="/guides/$slug"
                  params={{ slug: g.slug }}
                  className="card-lift rounded-xl border border-border bg-card p-4 text-sm font-bold"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
