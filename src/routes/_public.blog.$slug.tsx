import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { POSTS, getPost } from "@/content/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    all: "كل المقالات",
    read: (n: number) => `قراءة ${n} دقائق`,
    ctaTitle: "ابحث عن فرصتك التالية",
    ctaSub: "تصفح الوظائف والمناوبات المتاحة الآن على SyndeoCare.",
    jobs: "تصفح الوظائف",
    shifts: "سوق المناوبات",
    other: "مقالات أخرى",
    notFound: "هذا المقال غير موجود",
  },
  en: {
    all: "All articles",
    read: (n: number) => `${n} min read`,
    ctaTitle: "Find your next opportunity",
    ctaSub: "Browse the jobs and shifts available right now on SyndeoCare.",
    jobs: "Browse jobs",
    shifts: "Shift market",
    other: "Other articles",
    notFound: "This article does not exist",
  },
} as const;

export const Route = createFileRoute("/_public/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "مقال غير موجود | SyndeoCare" }, { name: "robots", content: "noindex" }] };
    }
    const { post } = loaderData;
    return {
      meta: [
        { title: `${post.title.ar} | SyndeoCare` },
        { name: "description", content: post.excerpt.ar },
        { property: "og:title", content: post.title.ar },
        { property: "og:description", content: post.excerpt.ar },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <BlogMissing />,
  notFoundComponent: () => <BlogMissing />,
  component: BlogPost,
});

function BlogMissing() {
  const { lang } = useLang();
  const c = TXT[lang];
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">{c.notFound}</h1>
      <Button className="mt-6" asChild>
        <Link to="/blog">{c.all}</Link>
      </Button>
    </div>
  );
}

function BlogPost() {
  const { post } = Route.useLoaderData();
  const { lang } = useLang();
  const c = TXT[lang];
  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <section className="page-hero py-14">
        <div className="mx-auto max-w-3xl px-4">
          <Button variant="ghost" size="sm" asChild className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link to="/blog">
              <ArrowRight className="size-4 rtl:rotate-180" /> {c.all}
            </Link>
          </Button>
          <Badge variant="secondary" className="mt-4">{post.category[lang]}</Badge>
          <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">{post.title[lang]}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-1">
              <Clock className="size-4" /> {c.read(post.readMinutes)}
            </span>
            <span>{formatDate(post.date, lang)}</span>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt[lang]}</p>
        {post.sections.map((section) => (
          <section key={section.heading.ar} className="mt-8">
            <h2 className="font-display text-xl font-bold">{section.heading[lang]}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.ar} className="mt-3 leading-relaxed text-muted-foreground">
                {paragraph[lang]}
              </p>
            ))}
          </section>
        ))}

        <div className="card-lift mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">{c.ctaTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.ctaSub}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/jobs">{c.jobs}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/jobs" search={{ kind: "shift" }}>{c.shifts}</Link>
            </Button>
          </div>
        </div>

        <h2 className="mt-12 font-display text-xl font-bold">{c.other}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {others.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="card-lift rounded-lg border border-border bg-card p-4 text-sm font-bold hover:border-accent/30"
            >
              {p.title[lang]}
            </Link>
          ))}
        </div>
      </article>
    </>
  );
}
