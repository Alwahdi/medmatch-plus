import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  FileUp,
  Gift,
  Globe2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import hero640 from "@/assets/hero-640.webp";
import hero960 from "@/assets/hero-960.webp";
import hero1280 from "@/assets/hero-1280.webp";
import hero1600 from "@/assets/hero-1600.webp";
import forPros640 from "@/assets/for-professionals-640.webp";
import forPros1024 from "@/assets/for-professionals-1024.webp";
import forEmployers640 from "@/assets/for-employers-640.webp";
import forEmployers1024 from "@/assets/for-employers-1024.webp";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard, type JobRow } from "@/components/job-card";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";
import { publicJobsQuery, publicShiftsQuery, withSpecialties } from "@/lib/public-listings";
import { GUIDES } from "@/content/guides";
import { DICT, useLang } from "@/lib/i18n";
import { ErrorState } from "@/components/error-state";
import { canonical, shareMeta, absoluteUrl, OG_IMAGE } from "@/lib/seo";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: DICT["home.metaTitle"]!.ar },
      {
        name: "description",
        content: DICT["home.metaDescription"]!.ar,
      },
      { property: "og:title", content: DICT["home.metaTitle"]!.ar },
      {
        property: "og:description",
        content: DICT["home.metaDescription"]!.ar,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...shareMeta("/"),
    ],
    // No <link rel=preload> for the hero: the <img> is in the SSR HTML with
    // fetchPriority="high", and the head serializer emitted a duplicate,
    // href-less preload tag.
    links: canonical("/"),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SyndeoCare",
          url: absoluteUrl("/"),
          inLanguage: ["ar", "en"],
          image: OG_IMAGE,
          publisher: { "@type": "Organization", name: "SyndeoCare", url: absoluteUrl("/") },
        }),
      },
    ],
  }),
  component: Home,
});

const HERO_SRCSET = `${hero640} 640w, ${hero960} 960w, ${hero1280} 1280w, ${hero1600} 1600w`;
const HERO_SIZES = "100vw";
const CARD_SIZES = "(min-width: 768px) 50vw, 100vw";

const WHY = [
  { icon: ShieldCheck, key: "verified" },
  { icon: Zap, key: "oneclick" },
  { icon: Globe2, key: "arab" },
  { icon: Gift, key: "free" },
];

const EMPLOYER_STEP_KEYS = ["employer1", "employer2", "employer3", "employer4"];
const SEEKER_STEP_KEYS = ["seeker1", "seeker2", "seeker3", "seeker4"];

function Home() {
  const { t, lang } = useLang();
  const ar = lang !== "en";
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [tab, setTab] = useState<"employers" | "seekers">("employers");

  const { data: jobs, isError: jobsErr, refetch: jobsRefetch, isLoading: jobsLoading } = useQuery({
    queryKey: ["home-jobs"],
    queryFn: async () => {
      const { data, error } = await publicJobsQuery()
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return withSpecialties(data) as unknown as JobRow[];
    },
  });

  const { data: shifts, isError: shiftsErr, refetch: shiftsRefetch, isLoading: shiftsLoading } = useQuery({
    queryKey: ["home-shifts"],
    queryFn: async () => {
      const { data, error } = await publicShiftsQuery()
        .order("starts_at", { ascending: true })
        .limit(4);
      if (error) throw error;
      return withSpecialties(data) as unknown as ShiftRow[];
    },
  });

  const { data: specialties, isError: specialtiesErr, refetch: specialtiesRefetch } = useQuery({
    queryKey: ["home-specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,slug,name_ar").limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  function search(e: React.FormEvent) {
    e.preventDefault();
    const searchParams: { q?: string; city?: string } = {};
    if (q.trim()) searchParams.q = q.trim();
    if (loc.trim()) searchParams.city = loc.trim();
    navigate({ to: "/jobs", search: searchParams });
  }

  const stepKeys = tab === "employers" ? EMPLOYER_STEP_KEYS : SEEKER_STEP_KEYS;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate min-h-[min(640px,78dvh)] overflow-hidden bg-foreground">
        <img
          src={hero960}
          srcSet={HERO_SRCSET}
          sizes={HERO_SIZES}
          alt=""
          width={1600}
          height={1104}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-foreground/75" />
        <div className="mx-auto flex min-h-[min(640px,78dvh)] max-w-6xl items-center px-4 pb-48 pt-10 sm:pb-36 md:pb-32 md:pt-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-md bg-background/10 px-3 py-1.5 text-sm font-medium text-primary-foreground ring-1 ring-background/20">
              <span className="size-2 rounded-full bg-success" />
              {t("home.hero.badge")}
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-bold text-primary-foreground md:text-5xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-primary-foreground/85">
              {t("home.hero.subtitle")}
            </p>
             <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/for-facilities">{t("home.hero.ctaEmployers")}</Link>
              </Button>
              <Button
                size="lg"
                asChild
                 variant="outline"
                 className="border-primary-foreground/30 bg-background/10 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground"
              >
                <Link to="/jobs">{t("home.hero.ctaSeekers")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Search bar */}
         <div className="absolute inset-x-0 bottom-5 px-4 md:bottom-8">
          <form
            onSubmit={search}
            className="mx-auto flex max-w-5xl flex-col gap-2 rounded-lg border border-border bg-card p-2 shadow-lift sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-surface px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("home.search.placeholderRole")}
                maxLength={80}
                className="h-12 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-surface px-3 sm:max-w-64">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder={t("home.search.placeholderLoc")}
                maxLength={60}
                className="h-12 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              {t("home.search.button")}
            </Button>
          </form>
        </div>
      </section>

      {/* Why */}
        <section className="bg-background pb-12 pt-10 md:pb-16 md:pt-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-sm font-semibold tracking-wide text-accent">
            {t("home.why.label")}
          </h2>
           <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {WHY.map((f) => (
                <div key={f.key} className="card-lift rounded-lg border border-border bg-card p-4 sm:p-6">
                 <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{t(`home.why.${f.key}.title` as const)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`home.why.${f.key}.text` as const)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two sides */}
      <section className="soft-surface py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-extrabold">
            {t("home.sides.title")}
          </h2>
          <div className="mt-7 grid gap-5 md:mt-10 md:grid-cols-2 md:gap-6">
             <article className="card-lift overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={forPros1024}
                srcSet={`${forPros640} 640w, ${forPros1024} 1024w`}
                sizes={CARD_SIZES}
                alt={t("home.sides.pros.title")}
                width={1280}
                height={960}
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover sm:h-56"
              />
              <div className="p-6">
                <span className="text-xs font-semibold text-accent">{t("home.sides.pros.label")}</span>
                <h3 className="mt-2 font-display text-xl font-bold">
                  {t("home.sides.pros.title")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("home.sides.pros.text")}
                </p>
                <Button className="mt-5" asChild>
                  <Link to="/jobs">{t("home.sides.pros.cta")}</Link>
                </Button>
              </div>
            </article>

             <article className="card-lift overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={forEmployers1024}
                srcSet={`${forEmployers640} 640w, ${forEmployers1024} 1024w`}
                sizes={CARD_SIZES}
                alt={t("home.sides.employers.title")}
                width={1280}
                height={960}
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover sm:h-56"
              />
              <div className="p-6">
                <span className="text-xs font-semibold text-accent">{t("home.sides.employers.label")}</span>
                <h3 className="mt-2 font-display text-xl font-bold">{t("home.sides.employers.title")}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("home.sides.employers.text")}
                </p>
                <Button className="mt-5" asChild>
                  <Link to="/for-facilities">{t("home.sides.employers.cta")}</Link>
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-sm font-semibold tracking-wide text-accent">
            {t("home.steps.label")}
          </p>
          <h2 className="mt-3 text-center font-display text-3xl font-extrabold">
            {t("home.steps.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            {t("home.steps.subtitle")}
          </p>

          <div className="mt-8 flex justify-center">
             <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {(
                [
                  ["employers", t("home.steps.tabEmployers")],
                  ["seekers", t("home.steps.tabSeekers")],
                ] as const
              ).map(([key, label]) => (
                 <Button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                   variant="ghost"
                   className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${
                    tab === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                 </Button>
              ))}
            </div>
          </div>

          <ol className="mt-8 grid gap-3 sm:gap-5 md:mt-10 md:grid-cols-2 lg:grid-cols-4">
            {stepKeys.map((key, i) => (
               <li key={key} className="card-lift rounded-lg border border-border bg-card p-4 sm:p-6">
                 <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 font-display text-lg font-extrabold text-accent">
                  {i + 1}
                </span>
                {key === "employer3" && (
                   <span className="mt-4 inline-block rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-strong">
                    {t("home.steps.employer3.highlight")}
                  </span>
                )}
                {key === "seeker2" && (
                   <span className="mt-4 inline-block rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-strong">
                    {t("home.steps.seeker2.highlight")}
                  </span>
                )}
                <h3 className="mt-3 text-base font-bold">{t(`home.steps.${key}.title` as const)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`home.steps.${key}.text` as const)}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {tab === "employers" ? (
              <Button asChild>
                <Link to="/for-facilities">{t("home.steps.employerCta")}</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/register">
                  {t("home.steps.seekerCta")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* AI CV */}
      <section className="soft-surface py-12 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent">
              {t("home.ai.label")}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-snug font-extrabold">
              {t("home.ai.title")}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t("home.ai.text")}
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold">{t("home.ai.forPros")}</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>{t("home.ai.pros1")}</li>
                  <li>{t("home.ai.pros2")}</li>
                  <li>{t("home.ai.pros3")}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold">{t("home.ai.forEmployers")}</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>{t("home.ai.emp1")}</li>
                  <li>{t("home.ai.emp2")}</li>
                  <li>{t("home.ai.emp3")}</li>
                </ul>
              </div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              {t("home.ai.languages")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/cv-import">{t("home.ai.ctaPrimary")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/jobs">{t("home.ai.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>

           <div className="card-lift rounded-lg border border-border bg-card p-8">
             <div className="flex items-center gap-3 rounded-lg border border-dashed border-accent/50 bg-accent/5 p-5">
               <span className="flex size-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <FileUp className="size-5" />
              </span>
              <div>
                <div className="text-sm font-bold">cv.pdf</div>
                <div className="text-xs text-muted-foreground">{t("home.ai.uploading")}</div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { icon: BadgeCheck, label: t("home.ai.rows.specialty") },
                { icon: ShieldCheck, label: t("home.ai.rows.license") },
                { icon: Sparkles, label: t("home.ai.rows.skills") },
                { icon: Building2, label: t("home.ai.rows.experience") },
              ].map((row) => (
                <div
                  key={row.label}
                   className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3 text-sm"
                >
                  <row.icon className="size-4 text-accent" />
                  {row.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest jobs */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.jobs.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.jobs.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.jobs.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/jobs">
                {t("home.jobs.cta")} <ArrowLeft className="size-4 ltr:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {jobsErr ? (
              <ErrorState onRetry={() => void jobsRefetch()} />
            ) : jobsLoading
               ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
              : jobs?.length
                ? jobs.map((job, index) => <div key={job.id} className={index > 2 ? "hidden sm:block" : undefined}><JobCard job={job} /></div>)
                : (
                  <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {ar ? "لا توجد وظائف منشورة حالياً. فعّل تنبيهاً لتصلك أول فرصة فور نشرها." : "No jobs are published right now. Set an alert to hear about the first opening."}
                    </p>
                    <Button asChild className="mt-4 min-h-11 rounded-lg">
                      <Link to="/register">{ar ? "أنشئ حساباً وفعّل التنبيهات" : "Create an account and set alerts"}</Link>
                    </Button>
                  </div>
                )}
          </div>
        </div>
      </section>

      {/* Shifts */}
      <section className="soft-surface py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.shifts.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.shifts.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.shifts.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
               <Link to="/jobs" search={{ kind: "shift" }}>
                 {t("home.shifts.cta")} <ArrowLeft className="size-4 ltr:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {shiftsErr ? (
              <ErrorState onRetry={() => void shiftsRefetch()} />
            ) : shiftsLoading
               ? [...Array(2)].map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)
              : shifts?.length
                ? shifts.map((shift, index) => <div key={shift.id} className={index > 1 ? "hidden sm:block" : undefined}><ShiftCard shift={shift} /></div>)
                : (
                  <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {ar ? "لا توجد مناوبات متاحة حالياً. تابع الصفحة أو فعّل تنبيهاً لتصلك المناوبات الجديدة." : "No shifts are open right now. Check back or set an alert for new shifts."}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Button asChild className="min-h-11 rounded-lg">
                        <Link to="/register">{ar ? "فعّل تنبيه المناوبات" : "Set a shift alert"}</Link>
                      </Button>
                      <Button asChild variant="outline" className="min-h-11 rounded-lg">
                        <Link to="/jobs">{ar ? "تصفح الوظائف" : "Browse jobs"}</Link>
                      </Button>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.specialties.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.specialties.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.specialties.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/specialties">
                 {t("home.specialties.cta")} <ArrowLeft className="size-4 ltr:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {specialties?.map((s) => (
              <Link
                key={s.id}
                to="/specialties/$slug"
                params={{ slug: s.slug }}
                 className="card-lift rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
              >
                {s.name_ar}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="soft-surface py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.guides.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.guides.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.guides.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/guides">
                 {t("home.guides.cta")} <ArrowLeft className="size-4 ltr:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {GUIDES.slice(0, 3).map((g) => (
              <Link
                key={g.slug}
                to="/guides/$slug"
                params={{ slug: g.slug }}
                 className="card-lift rounded-lg border border-border bg-card p-6"
              >
                <span className="text-xs font-semibold text-accent">{g.category}</span>
                <h3 className="mt-2 font-display text-lg leading-snug font-bold">{g.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {g.description}
                </p>
                <span className="mt-4 block text-xs text-muted-foreground">
                  {t("home.guides.readMinutes").replace("{n}", String(g.readMinutes))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-surface py-12 md:py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
           <span className="flex size-12 items-center justify-center rounded-lg bg-primary-foreground/12 text-primary-foreground">
            <Bell className="size-6" />
          </span>
           <h2 className="font-display text-3xl font-extrabold text-primary-foreground">
            {t("home.cta.title")}
          </h2>
           <p className="max-w-xl text-primary-foreground/85">
            {t("home.cta.subtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/register">
                {t("home.cta.seeker")}
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
               variant="outline"
               className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <Link to="/for-facilities">{t("home.cta.employer")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
