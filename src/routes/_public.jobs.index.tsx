import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowLeft, Briefcase, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard, type JobRow } from "@/components/job-card";
import { useSignedIn } from "@/components/page-chrome";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { matchScore } from "@/lib/match";
import { countryLabel, employmentLabel, EMPLOYMENT_LABELS, specialtyName } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useSpecialtyScope, inScope, type Scope } from "@/lib/specialty-filter";


export const Route = createFileRoute("/_public/jobs/")({
  head: () => ({
    meta: [
      { title: "الوظائف الطبية | SyndeoCare" },
      {
        name: "description",
        content:
          "تصفح وظائف الأطباء والتمريض والصيادلة والفنيين في اليمن والخليج ومصر، مع نطاق راتب معلن ونسبة توافق لكل وظيفة.",
      },
      { property: "og:title", content: "الوظائف الطبية | SyndeoCare" },
      {
        property: "og:description",
        content: "وظائف طبية في المنطقة العربية بنطاق راتب معلن ومطابقة ذكية.",
      },
    ],
  }),
  component: JobsPage,
});

const ALL = "all";

const TXT = {
  ar: {
    badge: "وظائف دائمة من منشآت موثّقة",
    title: "الوظائف الطبية المفتوحة",
    sub: "فرص دائمة لأطباء، تمريض، صيادلة، وفنيين في اليمن والمنطقة العربية — بنطاق راتب معلن ومطابقة ذكية.",
    search: "ابحث بالمسمى أو التخصص أو المدينة",
    country: "الدولة",
    allCountries: "كل الدول",
    specialty: "التخصص",
    allSpecialties: "كل التخصصات",
    all: "الكل",
    home: "الرئيسية",
    dash: "لوحتي",
    filters: "التصفية",
    keyword: "كلمة البحث",
    jobType: "نوع الوظيفة",
    results: "نتائج البحث",
    count: (n: number) => `${n} وظيفة متاحة`,
    employer: "أنت ناشر وظائف؟",
    empty: "لا توجد وظائف مطابقة لبحثك.",
    reset: "إعادة ضبط الفلاتر",
    scopeMine: (n: string) => `تخصصي: ${n}`,
    scopeField: "مجالي الطبي",
    scopeAll: "كل التخصصات",
    showFilters: "إظهار التصفية",
    hideFilters: "إخفاء التصفية",
    sort: "الترتيب",
    sortMatch: "الأنسب لي",
    sortNew: "الأحدث",
    hideApplied: "إخفاء ما قدّمت عليه",
    myHeading: (n: string) => `وظائف تناسب تخصصك: ${n}`,
    myHeadingPlain: "وظائف مقترحة لك",
    mySub: "مرتّبة حسب توافقها مع ملفك المهني.",
  },
  en: {
    badge: "Permanent roles from verified employers",
    title: "Open medical jobs",
    sub: "Permanent roles for physicians, nurses, pharmacists and technicians across Yemen and the Arab region — with published salary ranges and smart matching.",
    search: "Search by title, specialty or city",
    country: "Country",
    allCountries: "All countries",
    specialty: "Specialty",
    allSpecialties: "All specialties",
    all: "All",
    home: "Home",
    dash: "My dashboard",
    filters: "Filters",
    keyword: "Keyword",
    jobType: "Job type",
    results: "Search results",
    count: (n: number) => `${n} jobs available`,
    employer: "Hiring? See plans",
    empty: "No jobs match your search.",
    reset: "Reset filters",
    scopeMine: (n: string) => `My specialty: ${n}`,
    scopeField: "My medical field",
    scopeAll: "All specialties",
    showFilters: "Show filters",
    hideFilters: "Hide filters",
    sort: "Sort",
    sortMatch: "Best match",
    sortNew: "Newest",
    hideApplied: "Hide jobs I applied to",
    myHeading: (n: string) => `Jobs matching your specialty: ${n}`,
    myHeadingPlain: "Jobs picked for you",
    mySub: "Ordered by how well they match your profile.",
  },
} as const;


function JobsPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const [q, setQ] = useState("");
  const [country, setCountry] = useState(ALL);
  const [specialty, setSpecialty] = useState(ALL);
  const [type, setType] = useState(ALL);
  const { user } = useSession();

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id,name_ar,name_en")
        .order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,slug,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialty_id,required_license,specialties(name_ar,name_en)",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (JobRow & {
        specialty_id: string | null;
        required_license: string | null;
      })[];
    },
  });

  const { pro: profile, mySpecialty, mySpecialtyId, fieldIds, hasSpecialty } = useSpecialtyScope();
  const signedIn = useSignedIn();
  const [scope, setScope] = useState<Scope>("all");
  const [scopeTouched, setScopeTouched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<"match" | "new">("new");
  const [sortTouched, setSortTouched] = useState(false);
  const [hideApplied, setHideApplied] = useState(true);

  useEffect(() => {
    if (!scopeTouched && hasSpecialty) setScope("field");
  }, [hasSpecialty, scopeTouched]);

  useEffect(() => {
    if (!sortTouched && profile) setSort("match");
  }, [profile, sortTouched]);

  const { data: appliedIds } = useQuery({
    queryKey: ["my-applied-job-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("job_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.job_id));
    },
  });

  const { data: savedIds } = useQuery({
    queryKey: ["my-saved-job-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.job_id));
    },
  });

  const pickScope = (next: Scope) => {
    setScopeTouched(true);
    setScope(next);
  };

  const countries = useMemo(
    () => Array.from(new Set((jobs ?? []).map((j) => j.country))),
    [jobs],
  );

  const scoreOf = (j: { specialty_id: string | null; min_experience: number; country: string; required_license: string | null }) =>
    matchScore(profile ?? null, {
      specialty_id: j.specialty_id,
      min_experience: j.min_experience,
      country: j.country,
      required_license: j.required_license,
    });

  const filtered = (jobs ?? [])
    .filter((j) => {
      if (country !== ALL && j.country !== country) return false;
      if (specialty !== ALL && j.specialty_id !== specialty) return false;
      if (specialty === ALL && !inScope(scope, j.specialty_id, mySpecialtyId, fieldIds)) return false;
      if (type !== ALL && j.employment_type !== type) return false;
      if (q && !`${j.title} ${j.specialties?.name_ar ?? ""} ${j.city}`.includes(q)) return false;
      if (hideApplied && appliedIds?.has(j.id)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "match" && profile) return (scoreOf(b) ?? 0) - (scoreOf(a) ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const reset = () => {
    setQ("");
    pickScope("all");
    setCountry(ALL);
    setSpecialty(ALL);
    setType(ALL);
  };


  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            {c.home}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{c.title}</span>
        </div>
      </div>

      {/* Compact hero */}
      <section className="page-hero py-10 md:py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-xs font-medium ring-1 ring-white/20">
            <Briefcase className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">{c.title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">{c.sub}</p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Filters sidebar */}
          <aside className="lg:order-1">
            <Button
              variant="outline"
              className="mb-3 w-full gap-2 lg:hidden"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="size-4" />
              {showFilters ? c.hideFilters : c.showFilters}
            </Button>
            <div
              className={`${showFilters ? "" : "hidden lg:block"} sticky top-24 rounded-2xl border border-border bg-card p-5`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold">{c.filters}</h2>
                <span className="grid size-9 place-items-center rounded-xl bg-surface text-muted-foreground">
                  <SlidersHorizontal className="size-4" />
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-medium">{c.keyword}</label>
                  <div className="relative mt-1.5">
                    <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground end-3" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={c.search}
                      className="h-11 pe-9"
                      maxLength={80}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{c.country}</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder={c.allCountries} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{c.allCountries}</SelectItem>
                      {countries.map((x) => (
                        <SelectItem key={x} value={x}>
                          {countryLabel(x, lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">{c.specialty}</label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder={c.allSpecialties} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{c.allSpecialties}</SelectItem>
                      {specialties?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {specialtyName(s, lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">{c.jobType}</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder={c.all} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{c.all}</SelectItem>
                      {Object.keys(EMPLOYMENT_LABELS).map((key) => (
                        <SelectItem key={key} value={key}>
                          {employmentLabel(key, lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="size-4" /> {c.reset}
                </Button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:order-2">
            {hasSpecialty && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2">
                {(
                  [
                    ["mine", c.scopeMine(specialtyName(mySpecialty!, lang))],
                    ["field", c.scopeField],
                    ["all", c.scopeAll],
                  ] as [Scope, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pickScope(key)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      scope === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-label">{c.results}</p>
                <h2 className="mt-1 font-display text-xl font-extrabold">
                  {c.count(filtered.length)}
                </h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/pricing">
                  {c.employer} <ArrowLeft className="size-4 ltr:rotate-180" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="mt-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">{c.empty}</p>
                <Button className="mt-4" variant="outline" onClick={reset}>
                  {c.reset}
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {filtered.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    match={matchScore(profile ?? null, {
                      specialty_id: job.specialty_id,
                      min_experience: job.min_experience,
                      country: job.country,
                      required_license: job.required_license,
                    })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
