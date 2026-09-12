import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { GUIDES } from "@/content/guides";
import { Badge } from "@/components/ui/badge";

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
    <section className="py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">الأدلة والمقالات</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          محتوى عملي مبني على ما تبحث عنه المنشآت فعلاً في الكوادر الصحية.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              to="/guides/$slug"
              params={{ slug: g.slug }}
              className="card-lift rounded-2xl border border-border bg-card p-6"
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
  );
}
