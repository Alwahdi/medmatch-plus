import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Newspaper } from "lucide-react";
import { POSTS } from "@/content/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    badge: "مدونة SyndeoCare",
    title: "المدونة",
    sub: "مقالات قصيرة عن سوق العمل الصحي، المناوبات، المقابلات، والتوظيف داخل المنشآت.",
    label: "أحدث المقالات",
    read: (n: number) => `قراءة ${n} دقائق`,
    more: "اقرأ المقال",
  },
  en: {
    badge: "SyndeoCare blog",
    title: "Blog",
    sub: "Short articles on the healthcare job market, shifts, interviews and hiring inside facilities.",
    label: "Latest articles",
    read: (n: number) => `${n} min read`,
    more: "Read article",
  },
} as const;

export const Route = createFileRoute("/_public/blog/")({
  head: () => ({
    meta: [
      { title: "مدونة التوظيف الصحي | SyndeoCare" },
      {
        name: "description",
        content: "مقالات عن سوق العمل الصحي والمناوبات والمقابلات ونصائح التوظيف للمنشآت الطبية.",
      },
      { property: "og:title", content: "مدونة التوظيف الصحي | SyndeoCare" },
      {
        property: "og:description",
        content: "مقالات عن سوق العمل الصحي والمناوبات والمقابلات ونصائح التوظيف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { lang } = useLang();
  const c = TXT[lang];

  return (
    <>
      <section className="page-hero py-14">
        <div className="mx-auto max-w-6xl px-4">
          <span className="section-label">{c.badge}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">{c.title}</h1>
          <p className="mt-3 max-w-2xl text-on-hero/85">{c.sub}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm font-bold text-muted-foreground">{c.label}</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="card-lift flex h-full flex-col rounded-lg border border-border bg-card p-5 hover:border-accent/30"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Newspaper className="size-4" />
                </span>
                <Badge variant="outline">{post.category[lang]}</Badge>
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{post.title[lang]}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt[lang]}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {c.read(post.readMinutes)}
                </span>
                <span>{formatDate(post.date, lang)}</span>
              </div>
              <span className="mt-3 flex items-center gap-1 text-sm font-bold text-primary">
                {c.more} <ArrowLeft className="size-4 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>

        <Button asChild variant="outline" className="mt-10">
          <Link to="/guides">{lang === "ar" ? "الأدلة والمقالات" : "Guides & articles"}</Link>
        </Button>
      </div>
    </>
  );
}
