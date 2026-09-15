import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowLeft, Briefcase, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard, type JobRow } from "@/components/job-card";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { useSignedIn } from "@/components/page-chrome";
import { engagementErrorText } from "@/lib/engagement-errors";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, employmentLabel, EMPLOYMENT_LABELS, specialtyName } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { useLang } from "@/lib/i18n";
import { useSpecialtyScope, inScope, type Scope } from "@/lib/specialty-filter";
import { labelCityWithCountry } from "@/lib/geo";
import { matchesQuery } from "@/lib/search";
import { FilterBar, type ActiveFilter } from "@/components/filter-bar";


type JobsSearch = {
  q?: string;
  country?: string;
  city?: string;
  specialty?: string;
  type?: string;
  sort?: string;
  kind?: string;
};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/_public/jobs/")({
  validateSearch: (search: Record<string, unknown>): JobsSearch => {
    const out: JobsSearch = {};
    for (const k of ["q", "country", "city", "specialty", "type", "sort", "kind"] as const) {
      const v = str(search[k]);
      if (v) out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "الفرص الطبية: وظائف ومناوبات | SyndeoCare" },
      {
        name: "description",
        content:
          "تصفح وظائف الأطباء والتمريض والصيادلة والفنيين في اليمن والخليج ومصر، مع نطاق راتب معلن وفلاتر دقيقة.",
      },
      { property: "og:title", content: "الفرص الطبية: وظائف ومناوبات | SyndeoCare" },
      {
        property: "og:description",
          content: "وظائف طبية في المنطقة العربية بنطاق راتب معلن وفلاتر حسب التخصص والموقع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobsPage,
});

const ALL = "all";

const TXT = {
  ar: {
    badge: "وظائف دائمة ومناوبات فورية من منشآت موثّقة",
    title: "الفرص الطبية المتاحة",
    sub: "فرص دائمة لأطباء، تمريض، صيادلة، وفنيين في اليمن والمنطقة العربية — بنطاق راتب معلن وفلاتر دقيقة.",
    search: "ابحث بالمسمى أو التخصص أو المدينة",
    country: "الدولة",
    allCountries: "كل الدول",
    city: "المدينة",
    allCities: "كل المدن",
    specialty: "التخصص",
    allSpecialties: "كل التخصصات",
    all: "الكل",
    home: "الرئيسية",
    dash: "لوحتي",
    filters: "التصفية",
    keyword: "كلمة البحث",
    jobType: "نوع الوظيفة",
    results: "نتائج البحث",
    count: (n: number) => `${n} فرصة متاحة`,
    employer: "أنت ناشر وظائف؟",
    empty: "لا توجد فرص مطابقة لبحثك.",
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
    myHeading: (n: string) => `فرص تناسب تخصصك: ${n}`,
    myHeadingPlain: "فرص مقترحة لك",
    kindAll: "الكل",
    kindJob: "وظائف",
    kindShift: "مناوبات",
    booked: "تم حجز المناوبة — ستجدها في صفحة مناوباتي",
    bookFailed: "تعذّر الحجز، ربما حُجزت المناوبة للتو",
    mySub: "مرتّبة حسب التخصص والموقع المسجلين في ملفك.",
  },
  en: {
    badge: "Permanent roles and instant shifts from verified employers",
    title: "Open medical opportunities",
    sub: "Permanent roles for physicians, nurses, pharmacists and technicians across Yemen and the Arab region — with published salary ranges and precise filters.",
    search: "Search by title, specialty or city",
    country: "Country",
    allCountries: "All countries",
    city: "City",
    allCities: "All cities",
    specialty: "Specialty",
    allSpecialties: "All specialties",
    all: "All",
    home: "Home",
    dash: "My dashboard",
    filters: "Filters",
    keyword: "Keyword",
    jobType: "Job type",
    results: "Search results",
    count: (n: number) => `${n} opportunities available`,
    employer: "Hiring? See plans",
    empty: "No opportunities match your search.",
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
    myHeading: (n: string) => `Opportunities matching your specialty: ${n}`,
    myHeadingPlain: "Opportunities picked for you",
    kindAll: "All",
    kindJob: "Jobs",
    kindShift: "Shifts",
    booked: "Shift booked — you'll find it under My shifts",
    bookFailed: "Booking failed, the shift may have just been taken",
    mySub: "Ordered using the specialty and location saved in your profile.",
  },
} as const;


function JobsPage() {
  const { lang } = useLang();
  const cbx = comboText(lang);
  const c = TXT[lang];
  const sp = Route.useSearch();
  const navigate = useNavigate();
  const setParams = (next: Partial<JobsSearch>) => {
    const merged: JobsSearch = { ...sp, ...next };
    for (const k of Object.keys(merged) as (keyof JobsSearch)[]) {
      if (!merged[k] || merged[k] === ALL) delete merged[k];
    }
    void navigate({ to: "/jobs", search: merged, replace: true });
  };
  const q = sp.q ?? "";
  const country = sp.country ?? ALL;
  const city = sp.city ?? ALL;
  const specialty = sp.specialty ?? ALL;
  const type = sp.type ?? ALL;
  const kind = sp.kind === "job" || sp.kind === "shift" ? sp.kind : ALL;
  const setKind = (v: string) => setParams({ kind: v, type: v === "shift" ? "" : (sp.type ?? "") });
  const setQ = (v: string) => setParams({ q: v });
  const setCity = (v: string) => setParams({ city: v });
  const setSpecialty = (v: string) => setParams({ specialty: v });
  const setType = (v: string) => setParams({ type: v });
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

  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(
          "id,title,notes,starts_at,ends_at,hourly_rate,currency,country,city,status,is_urgent,facility_verified,applications_count,specialty_id,specialties(name_ar,name_en)",
        )
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as unknown as (ShiftRow & { specialty_id: string | null })[];
    },
  });

  const queryClient = useQueryClient();
  const book = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase.rpc("book_open_shift", { _shift_id: shiftId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.booked);
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
    },
    onError: (e: Error) => {
      toast.error(engagementErrorText(e.message, lang));
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });

  const { data: bookedShiftIds } = useQuery({
    queryKey: ["my-booked-shift-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("shift_bookings").select("shift_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.shift_id));
    },
  });

  const { pro: profile, mySpecialty, mySpecialtyId, fieldIds, hasSpecialty } = useSpecialtyScope();
  const signedIn = useSignedIn();
  const [scope, setScope] = useState<Scope>("all");
  const [scopeTouched, setScopeTouched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortState, setSort] = useState<"match" | "new">("new");
  const sort: "match" | "new" = sp.sort === "match" || sp.sort === "new" ? sp.sort : sortState;
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
    () => Array.from(new Set([...(jobs ?? []), ...(shifts ?? [])].map((j) => j.country))),
    [jobs, shifts],
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          [...(jobs ?? []), ...(shifts ?? [])]
            .filter((j) => country === ALL || j.country === country)
            .map((j) => j.city)
            .filter((x): x is string => Boolean(x)),
        ),
      )
        .sort((a, b) => a.localeCompare(b, lang === "en" ? "en" : "ar"))
        .map((x) => ({
          value: x,
          label: country === ALL ? labelCityWithCountry(x, lang) : x,
          keywords: [x, labelCityWithCountry(x, lang)],
        })),
    [jobs, shifts, country, lang],
  );

  const relevanceOf = (j: { specialty_id: string | null; country: string }) =>
    Number(!!profile?.specialty_id && j.specialty_id === profile.specialty_id) * 2 +
    Number(!!profile?.country && j.country === profile.country);

  const filtered = (jobs ?? [])
    .filter((j) => {
      if (country !== ALL && j.country !== country) return false;
      if (city !== ALL && j.city !== city) return false;
      if (specialty !== ALL && j.specialty_id !== specialty) return false;
      if (specialty === ALL && !inScope(scope, j.specialty_id, mySpecialtyId, fieldIds)) return false;
      if (type !== ALL && j.employment_type !== type) return false;
      if (
        q &&
        !matchesQuery(
          [
            j.title,
            j.specialties?.name_ar,
            j.specialties?.name_en,
            j.city,
            j.country,
            countryLabel(j.country, lang),
            employmentLabel(j.employment_type, lang),
          ],
          q,
        )
      )
        return false;
      if (hideApplied && appliedIds?.has(j.id)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "match" && profile) return relevanceOf(b) - relevanceOf(a);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filteredShifts = (kind === "job" ? [] : shifts ?? []).filter((sh) => {
    if (country !== ALL && sh.country !== country) return false;
    if (city !== ALL && sh.city !== city) return false;
    if (specialty !== ALL && sh.specialty_id !== specialty) return false;
    if (specialty === ALL && !inScope(scope, sh.specialty_id, mySpecialtyId, fieldIds)) return false;
    if (
      q &&
      !matchesQuery(
        [sh.title, sh.notes, sh.city, sh.country, countryLabel(sh.country, lang), sh.specialties?.name_ar, sh.specialties?.name_en],
        q,
      )
    )
      return false;
    return true;
  });

  type Item =
    | { kind: "job"; id: string; sortAt: number; job: (typeof filtered)[number] }
    | { kind: "shift"; id: string; sortAt: number; shift: (typeof filteredShifts)[number] };

  const items: Item[] = [
    ...(kind === "shift" ? [] : filtered).map<Item>((j) => ({
      kind: "job",
      id: j.id,
      sortAt: new Date(j.created_at).getTime(),
      job: j,
    })),
    ...filteredShifts.map<Item>((sh) => ({
      kind: "shift",
      id: sh.id,
      sortAt: new Date(sh.starts_at).getTime(),
      shift: sh,
    })),
  ].sort((a, b) => {
    if (kind === ALL && a.kind !== b.kind) return a.kind === "shift" ? -1 : 1;
    return a.kind === "shift" ? a.sortAt - b.sortAt : b.sortAt - a.sortAt;
  });

  const reset = () => {
    pickScope("all");
    void navigate({ to: "/jobs", search: {}, replace: true });
  };

  const activeFilters: ActiveFilter[] = [
    q ? { key: "q", label: q, onClear: () => setParams({ q: "" }) } : null,
    country !== ALL
      ? { key: "country", label: countryLabel(country, lang), onClear: () => setParams({ country: "", city: "" }) }
      : null,
    city !== ALL ? { key: "city", label: city, onClear: () => setCity(ALL) } : null,
    specialty !== ALL
      ? {
          key: "specialty",
          label:
            specialtyName((specialties ?? []).find((s2) => s2.id === specialty) ?? null, lang) ??
            c.specialty,
          onClear: () => setSpecialty(ALL),
        }
      : null,
    type !== ALL
      ? { key: "type", label: employmentLabel(type, lang), onClear: () => setType(ALL) }
      : null,
  ].filter(Boolean) as ActiveFilter[];


  return (
    <>
      {signedIn ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-card">
          <p className="section-label">{c.results}</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold">
            {mySpecialty ? c.myHeading(specialtyName(mySpecialty, lang)) : c.myHeadingPlain}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{c.mySub}</p>
        </section>
      ) : (
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
               <span className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/12 px-4 py-1.5 text-xs font-medium ring-1 ring-primary-foreground/20">
                <Briefcase className="size-4" />
                {c.badge}
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">{c.title}</h1>
               <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">{c.sub}</p>
            </div>
          </section>
        </>
      )}

      <section className={signedIn ? "py-6" : "py-8 md:py-12"}>

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
              className={`${showFilters ? "" : "hidden lg:block"} sticky top-24 rounded-lg border border-border bg-card p-5 shadow-card`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold">{c.filters}</h2>
                <span className="grid size-9 place-items-center rounded-lg bg-surface text-muted-foreground">
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
                  <div className="mt-1.5">
                    <Combobox
                      options={[
                        { value: ALL, label: c.allCountries },
                        ...countries.map((x) => ({ value: x, label: countryLabel(x, lang), keywords: [x] })),
                      ]}
                      value={country}
                      onChange={(v) => setParams({ country: v, city: "" })}
                      placeholder={c.allCountries}
                      searchPlaceholder={cbx.search}
                      emptyText={cbx.empty}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{c.city}</label>
                  <div className="mt-1.5">
                    <Combobox
                      options={[
                        { value: ALL, label: c.allCities },
                        ...cities,
                      ]}
                      value={city}
                      onChange={setCity}
                      placeholder={c.allCities}
                      searchPlaceholder={cbx.search}
                      emptyText={cbx.empty}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{c.specialty}</label>
                  <div className="mt-1.5">
                    <Combobox
                      options={[
                        { value: ALL, label: c.allSpecialties },
                        ...(specialties ?? []).map((s) => ({
                          value: s.id,
                          label: specialtyName(s, lang) ?? s.name_ar,
                          keywords: [s.name_ar, s.name_en].filter(Boolean) as string[],
                        })),
                      ]}
                      value={specialty}
                      onChange={setSpecialty}
                      placeholder={c.allSpecialties}
                      searchPlaceholder={cbx.search}
                      emptyText={cbx.empty}
                    />
                  </div>
                </div>

                <div className={kind === "shift" ? "hidden" : undefined}>
                  <label className="text-sm font-medium">{c.jobType}</label>
                  <div className="mt-1.5">
                    <Combobox
                      options={[
                        { value: ALL, label: c.all },
                        ...Object.keys(EMPLOYMENT_LABELS).map((key) => ({
                          value: key,
                          label: employmentLabel(key, lang),
                          keywords: [employmentLabel(key, "ar"), employmentLabel(key, "en")],
                        })),
                      ]}
                      value={type}
                      onChange={setType}
                      placeholder={c.all}
                      searchPlaceholder={cbx.search}
                      emptyText={cbx.empty}
                    />
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="size-4" /> {c.reset}
                </Button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:order-2">
            <div className="mb-4 flex items-center gap-1 rounded-lg bg-surface p-1" role="tablist">
              {(
                [
                  [ALL, c.kindAll],
                  ["job", c.kindJob],
                  ["shift", c.kindShift],
                ] as [string, string][]
              ).map(([key, label]) => (
                 <Button
                  key={key}
                  type="button"
                   variant="ghost"
                  role="tab"
                  aria-selected={kind === key}
                  onClick={() => setKind(key)}
                  className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    kind === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                 </Button>
              ))}
            </div>
            {hasSpecialty && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
                {(
                  [
                    ["mine", c.scopeMine(specialtyName(mySpecialty!, lang))],
                    ["field", c.scopeField],
                    ["all", c.scopeAll],
                  ] as [Scope, string][]
                ).map(([key, label]) => (
                   <Button
                    key={key}
                    type="button"
                     variant="ghost"
                    onClick={() => pickScope(key)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      scope === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                   </Button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-label">{c.results}</p>
                <h2 className="mt-1 font-display text-xl font-extrabold">
                  {c.count(items.length)}
                </h2>
                <FilterBar
                  className="mt-2"
                  filters={activeFilters}
                  onClearAll={reset}
                />
              </div>
              {!signedIn && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/pricing">
                    {c.employer} <ArrowLeft className="size-4 ltr:rotate-180" />
                  </Link>
                </Button>
              )}
            </div>

            {signedIn && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profile && (
                  <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
                    {(
                      [
                        ["match", c.sortMatch],
                        ["new", c.sortNew],
                      ] as ["match" | "new", string][]
                    ).map(([key, label]) => (
                       <Button
                        key={key}
                        type="button"
                         variant="ghost"
                        onClick={() => {
                          setSortTouched(true);
                          setSort(key);
                          setParams({ sort: key });
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          sort === key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                       </Button>
                    ))}
                  </div>
                )}
                {!!appliedIds?.size && (
                   <Button
                    type="button"
                     variant="ghost"
                    onClick={() => setHideApplied((v) => !v)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      hideApplied
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.hideApplied}
                   </Button>
                )}
              </div>
            )}

            {isLoading || shiftsLoading ? (
              <div className="mt-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="mt-10 rounded-lg border border-border bg-card p-10 text-center shadow-card">
                <p className="text-muted-foreground">{c.empty}</p>
                <Button className="mt-4" variant="outline" onClick={reset}>
                  {c.reset}
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {items.map((item) =>
                  item.kind === "job" ? (
                    <JobCard
                      key={`job-${item.id}`}
                      job={item.job}
                      applied={!!appliedIds?.has(item.id)}
                      saved={!!savedIds?.has(item.id)}
                      recommended={signedIn && relevanceOf(item.job) > 0}
                    />
                  ) : (
                    <ShiftCard
                      key={`shift-${item.id}`}
                      shift={item.shift}
                      busy={book.isPending}
                      mine={!!bookedShiftIds?.has(item.id)}
                      recommended={signedIn && !!mySpecialtyId && item.shift.specialty_id === mySpecialtyId}
                      onBook={() => {
                        if (!user) {
                          void navigate({ to: "/auth" });
                          return;
                        }
                        book.mutate(item.id);
                      }}
                    />
                  ),
                )}
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
}
