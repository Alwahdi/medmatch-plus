import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, BookOpen, ArrowLeft } from "lucide-react";
import { GUIDES } from "@/content/guides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guides/")({
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
  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <BookOpen className="size-4" />
            محتوى مهني عملي
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">الأدلة والمقالات</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            إرشادات عملية مبنية على ما تبحث عنه المنشآت فعلاً في الكوادر الصحية.
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">أحدث المنشورات</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">أدلة المهن الطبية</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/jobs">
                تصفح الوظائف <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                to="/guides/$slug"
                params={{ slug: g.slug }}
                className="card-lift rounded-2xl border border-border bg-card p-6 hover:border-accent/30"
              >
                <Badge variant="secondary">{g.category}</Badge>
                <h2 className="mt-3 font-display text-xl font-bold">{g.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.description}</p>
                <span className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> قراءة {g.readMinutes} دقائق
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
