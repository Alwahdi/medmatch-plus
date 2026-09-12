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
import heroImage from "@/assets/hero.jpg";
import forProsImage from "@/assets/for-professionals.jpg";
import forEmployersImage from "@/assets/for-employers.jpg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard, type JobRow } from "@/components/job-card";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";
import { GUIDES } from "@/content/guides";
import { DICT, useLang } from "@/lib/i18n";

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
    ],
  }),
  component: Home,
});

const WHY = [
  { icon: ShieldCheck, key: "verified" },
  { icon: Zap, key: "oneclick" },
  { icon: Globe2, key: "arab" },
  { icon: Gift, key: "free" },
];

const EMPLOYER_STEP_KEYS = ["employer1", "employer2", "employer3", "employer4"];
const SEEKER_STEP_KEYS = ["seeker1", "seeker2", "seeker3", "seeker4"];

function Home() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [tab, setTab] = useState<"employers" | "seekers">("employers");

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["home-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,slug,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialties(name_ar)",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as unknown as JobRow[];
    },
  });

  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["home-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(
          "id,title,notes,starts_at,ends_at,hourly_rate,currency,country,city,status,is_urgent,facility_verified,applications_count,specialties(name_ar)",
        )
        .eq("status", "open")
        .order("starts_at", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data as unknown as ShiftRow[];
    },
  });

  const { data: specialties } = useQuery({
    queryKey: ["home-specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,slug,name_ar").limit(12);
      return data ?? [];
    },
  });

  function search(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/jobs" });
  }

  const stepKeys = tab === "employers" ? EMPLOYER_STEP_KEYS : SEEKER_STEP_KEYS;

  return (
    <>
      {/* Hero */}
      <section className="hero-surface relative pb-16 md:pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-14 md:grid-cols-2 md:pt-20">
          <div className="order-2 md:order-1">
            <img
              src={heroImage}
              alt={t("home.hero.title")}
              width={1600}
              height={1104}
              className="rounded-3xl shadow-2xl"
            />
          </div>

          <div className="order-1 md:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20">
              <span className="size-2 rounded-full bg-emerald-400" />
              {t("home.hero.badge")}
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight font-extrabold text-white md:text-5xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/85">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
                className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/jobs">{t("home.hero.ctaSeekers")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4">
          <form
            onSubmit={search}
            className="mx-auto flex max-w-5xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("home.search.placeholderRole")}
                maxLength={80}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface px-3 sm:max-w-64">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder={t("home.search.placeholderLoc")}
                maxLength={60}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-8">
              {t("home.search.button")}
            </Button>
          </form>
        </div>
      </section>

      {/* Why */}
      <section className="bg-background pt-24 pb-16 md:pt-28">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-sm font-semibold tracking-wide text-accent">
            {t("home.why.label")}
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((f) => (
              <div key={f.key} className="card-lift rounded-2xl border border-border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
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
      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-extrabold">
            {t("home.sides.title")}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="card-lift overflow-hidden rounded-3xl border border-border bg-card">
              <img
                src={forProsImage}
                alt={t("home.sides.pros.title")}
                width={1280}
                height={960}
                loading="lazy"
                className="h-56 w-full object-cover"
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

            <article className="card-lift overflow-hidden rounded-3xl border border-border bg-card">
              <img
                src={forEmployersImage}
                alt={t("home.sides.employers.title")}
                width={1280}
                height={960}
                loading="lazy"
                className="h-56 w-full object-cover"
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
      <section className="py-16 md:py-20">
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
            <div className="inline-flex rounded-full border border-border bg-card p-1">
              {(
                [
                  ["employers", t("home.steps.tabEmployers")],
                  ["seekers", t("home.steps.tabSeekers")],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    tab === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {stepKeys.map((key, i) => (
              <li key={key} className="card-lift rounded-2xl border border-border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 font-display text-lg font-extrabold text-accent">
                  {i + 1}
                </span>
                {key === "employer3" && (
                  <span className="mt-4 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {t("home.steps.employer3.highlight")}
                  </span>
                )}
                {key === "seeker2" && (
                  <span className="mt-4 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
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
      <section className="soft-surface py-16 md:py-20">
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

          <div className="card-lift rounded-3xl border border-border bg-card p-8">
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
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
                  className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm"
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
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.jobs.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.jobs.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.jobs.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/jobs">
                {t("home.jobs.cta")} <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobsLoading
              ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)
              : jobs?.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      </section>

      {/* Shifts */}
      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.shifts.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.shifts.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.shifts.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/shifts">
                {t("home.shifts.cta")} <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-4">
            {shiftsLoading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)
              : shifts?.map((shift) => <ShiftCard key={shift.id} shift={shift} />)}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.specialties.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.specialties.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.specialties.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/specialties">
                {t("home.specialties.cta")} <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {specialties?.map((s) => (
              <Link
                key={s.id}
                to="/specialties/$slug"
                params={{ slug: s.slug }}
                className="card-lift rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
              >
                {s.name_ar}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">{t("home.guides.label")}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{t("home.guides.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.guides.subtitle")}</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/guides">
                {t("home.guides.cta")} <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {GUIDES.slice(0, 3).map((g) => (
              <Link
                key={g.slug}
                to="/guides/$slug"
                params={{ slug: g.slug }}
                className="card-lift rounded-2xl border border-border bg-card p-6"
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
      <section className="hero-surface py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/12 text-white">
            <Bell className="size-6" />
          </span>
          <h2 className="font-display text-3xl font-extrabold text-white">
            {t("home.cta.title")}
          </h2>
          <p className="max-w-xl text-white/85">
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
              className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <Link to="/for-facilities">{t("home.cta.employer")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
