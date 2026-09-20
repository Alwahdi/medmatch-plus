import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, ArrowLeft, Briefcase, RotateCcw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/job-card";
import { ShiftCard } from "@/components/shift-card";
import { useSignedIn } from "@/components/page-chrome";
import { engagementErrorText } from "@/lib/engagement-errors";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, employmentLabel, EMPLOYMENT_LABELS, specialtyName } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { useLang } from "@/lib/i18n";
import { useSpecialtyScope, type Scope } from "@/lib/specialty-filter";
import { labelCityWithCountry } from "@/lib/geo";
import { FilterBar, type ActiveFilter } from "@/components/filter-bar";
import { ErrorState } from "@/components/error-state";
import { canonical, shareMeta } from "@/lib/seo";
import {
  PAGE_SIZE_MIXED,
  PAGE_SIZE_SINGLE,
  fetchListingPlaces,
  searchPublicJobs,
  searchPublicShifts,
  type SearchFilters,
  type SearchJobRow,
  type SearchShiftRow,
} from "@/lib/public-search";


type JobsSearch = {
  q?: string;
  country?: string;
  city?: string;
  specialty?: string;
  type?: string;
  sort?: string;
  kind?: string;
  scope?: string;
  hideApplied?: string;
};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/_public/jobs/")({
  validateSearch: (search: Record<string, unknown>): JobsSearch => {
    const out: JobsSearch = {};
    for (const k of ["q", "country", "city", "specialty", "type", "sort", "kind", "scope", "hideApplied"] as const) {
      const v = str(search[k]);
      if (v) out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "الفرص الطبية: وظائف ومناوبات | Medical jobs & shifts | SyndeoCare" },
      {
        name: "description",
        content:
          "تصفح وظائف الأطباء والتمريض والصيادلة والفنيين في اليمن والخليج ومصر، مع نطاق راتب معلن وفلاتر دقيقة.",
      },
      { property: "og:title", content: "الفرص الطبية: وظائف ومناوبات | Medical jobs & shifts | SyndeoCare" },
      {
        property: "og:description",
          content: "وظائف طبية في المنطقة العربية بنطاق راتب معلن وفلاتر حسب التخصص والموقع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...shareMeta("/jobs"),
    ],
  links: canonical("/jobs"),
  }),
  component: JobsPage,
});

const ALL = "all";

const TXT = {
  ar: {
    badge: "وظائف دائمة ومناوبات فورية في مكان واحد",
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
    employer: "هل تمثل منشأة؟",
    empty: "لا توجد فرص مطابقة لبحثك.",
    reset: "إعادة ضبط الفلاتر",
    scopeMine: (n: string) => `تخصصي: ${n}`,
    scopeField: "مجالي الطبي",
    scopeAll: "كل التخصصات",
    showFilters: "إظهار التصفية",
    hideFilters: "إخفاء التصفية",
    applyFilters: "عرض النتائج",
    closeFilters: "إغلاق التصفية",
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
    loadMore: "عرض المزيد",
    loading: "جارٍ التحميل…",
    showing: (x: number, y: number) => `عرض ${x} من ${y}`,
    appended: (n: number) => `تمت إضافة ${n} فرصة إلى القائمة`,
  },
  en: {
    badge: "Permanent roles and instant shifts in one place",
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
    employer: "Hiring healthcare talent?",
    empty: "No opportunities match your search.",
    reset: "Reset filters",
    scopeMine: (n: string) => `My specialty: ${n}`,
    scopeField: "My medical field",
    scopeAll: "All specialties",
    showFilters: "Show filters",
    hideFilters: "Hide filters",
    applyFilters: "Show results",
    closeFilters: "Close filters",
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
    loadMore: "Load more",
    loading: "Loading…",
    showing: (x: number, y: number) => `Showing ${x} of ${y}`,
    appended: (n: number) => `${n} more opportunities added to the list`,
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
  const setType = (v: string) => setParams({ type: v, kind: v === ALL ? (sp.kind ?? "") : "job" });
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
      const { data, error } = await supabase.from("shift_bookings").select("shift_id").eq("user_id", user!.id).eq("status", "confirmed");
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.shift_id));
    },
  });

  const { pro: profile, mySpecialty, mySpecialtyId, fieldIds, hasSpecialty } = useSpecialtyScope();
  const signedIn = useSignedIn();
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    if (!showFilters) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowFilters(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showFilters]);
  const scope: Scope = sp.scope === "mine" || sp.scope === "field" || sp.scope === "all"
    ? sp.scope
    : hasSpecialty ? "field" : "all";
  const sort: "match" | "new" = sp.sort === "match" || sp.sort === "new"
    ? sp.sort
    : profile ? "match" : "new";
  const hideApplied = signedIn && sp.hideApplied !== "0";

  // معرفات ما قدّم عليه المستخدم نفسه فقط، بسقف معقول، وتُمرَّر كاستثناء للخادم.
  const { data: appliedIds } = useQuery({
    queryKey: ["my-applied-job-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("job_id")
        .eq("user_id", user!.id)
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((r) => r.job_id);
    },
  });
  const appliedSet = useMemo(() => new Set(appliedIds ?? []), [appliedIds]);

  const { data: savedIds } = useQuery({
    queryKey: ["my-saved-job-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.job_id));
    },
  });

  const pickScope = (next: Scope) => {
    setParams({ scope: next });
  };

  // قوائم الدول/المدن تأتي من مصدر عام مستقل حتى لا تعتمد على الصفحة المعروضة.
  const { data: places } = useQuery({
    queryKey: ["public-listing-places"],
    queryFn: fetchListingPlaces,
    staleTime: 5 * 60 * 1000,
  });

  const countries = useMemo(
    () => Array.from(new Set((places ?? []).map((p) => p.country))),
    [places],
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          (places ?? [])
            .filter((p) => country === ALL || p.country === country)
            .map((p) => p.city)
            .filter((x): x is string => Boolean(x)),
        ),
      )
        .sort((a, b) => a.localeCompare(b, lang === "en" ? "en" : "ar"))
        .map((x) => ({
          value: x,
          label: country === ALL ? labelCityWithCountry(x, lang) : x,
          keywords: [x, labelCityWithCountry(x, lang)],
        })),
    [places, country, lang],
  );

  const relevanceOf = (j: { specialty_id: string | null; country: string }) =>
    Number(!!profile?.specialty_id && j.specialty_id === profile.specialty_id) * 2 +
    Number(!!profile?.country && j.country === profile.country);

  // نطاق التخصص ليس تفويضاً — مجرد تصفية تُمرَّر إلى الخادم.
  const scopeIds =
    specialty !== ALL
      ? null
      : scope === "mine"
        ? mySpecialtyId
          ? [mySpecialtyId]
          : null
        : scope === "field"
          ? fieldIds.length
            ? fieldIds
            : null
          : null;

  const excludeJobIds = hideApplied && appliedIds?.length ? appliedIds : null;

  const filters: SearchFilters = {
    q,
    country: country === ALL ? null : country,
    city: city === ALL ? null : city,
    specialtyId: specialty === ALL ? null : specialty,
    specialtyIds: scopeIds,
    type: type === ALL ? null : type,
    sort: sort === "match" && profile ? "match" : "new",
    prefSpecialtyId: sort === "match" ? (profile?.specialty_id ?? null) : null,
    prefCountry: sort === "match" ? (profile?.country ?? null) : null,
    excludeJobIds,
  };

  // في تبويب «الكل» نعرض المناوبات القادمة أولاً ثم أحدث الوظائف، وكل مصدر
  // يُقسَّم إلى صفحات مستقلة حتى لا يتكرر أو يضيع أي صف عند «عرض المزيد».
  const pageSize = kind === ALL ? PAGE_SIZE_MIXED : PAGE_SIZE_SINGLE;
  const filterKey = JSON.stringify({ ...filters, pageSize });

  const jobsQuery = useInfiniteQuery({
    queryKey: ["search-jobs", filterKey],
    enabled: kind !== "shift",
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => searchPublicJobs(filters, pageParam, pageSize, signal),
    getNextPageParam: (last) =>
      last.offset + last.rows.length < last.total ? last.offset + pageSize : undefined,
  });

  const shiftsQuery = useInfiniteQuery({
    queryKey: ["search-shifts", filterKey],
    enabled: kind !== "job",
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => searchPublicShifts(filters, pageParam, pageSize, signal),
    getNextPageParam: (last) =>
      last.offset + last.rows.length < last.total ? last.offset + pageSize : undefined,
  });

  const loadedJobs: SearchJobRow[] =
    kind === "shift" ? [] : (jobsQuery.data?.pages.flatMap((p) => p.rows) ?? []);
  const loadedShifts: SearchShiftRow[] =
    kind === "job" ? [] : (shiftsQuery.data?.pages.flatMap((p) => p.rows) ?? []);

  const jobsTotal = kind === "shift" ? 0 : (jobsQuery.data?.pages[0]?.total ?? 0);
  const shiftsTotal = kind === "job" ? 0 : (shiftsQuery.data?.pages[0]?.total ?? 0);
  const total = jobsTotal + shiftsTotal;

  type Item =
    | { kind: "job"; id: string; job: SearchJobRow }
    | { kind: "shift"; id: string; shift: SearchShiftRow };

  const items: Item[] = [
    ...loadedShifts.map<Item>((sh) => ({ kind: "shift", id: sh.id, shift: sh })),
    ...loadedJobs.map<Item>((j) => ({ kind: "job", id: j.id, job: j })),
  ];

  const isLoading =
    (kind !== "shift" && jobsQuery.isPending) || (kind !== "job" && shiftsQuery.isPending);
  const listError = jobsQuery.error ?? shiftsQuery.error;
  const hasError = (kind !== "shift" && jobsQuery.isError) || (kind !== "job" && shiftsQuery.isError);
  const hasMore = Boolean(
    (kind !== "job" && shiftsQuery.hasNextPage) || (kind !== "shift" && jobsQuery.hasNextPage),
  );
  const loadingMore = shiftsQuery.isFetchingNextPage || jobsQuery.isFetchingNextPage;

  const [appendedNote, setAppendedNote] = useState("");
  const countBeforeLoad = useRef(0);
  const loadMore = () => {
    countBeforeLoad.current = items.length;
    const next =
      kind !== "job" && shiftsQuery.hasNextPage
        ? shiftsQuery.fetchNextPage()
        : jobsQuery.fetchNextPage();
    void next.then(() => setAppendedNote(""));
  };
  useEffect(() => {
    if (!loadingMore && countBeforeLoad.current && items.length > countBeforeLoad.current) {
      setAppendedNote(c.appended(items.length - countBeforeLoad.current));
      countBeforeLoad.current = 0;
    }
  }, [loadingMore, items.length, c]);


  const reset = () => {
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
        <div className="mx-auto mb-4 max-w-6xl px-4 lg:hidden">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowFilters(true)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="size-4" />
            {c.showFilters}
            {activeFilters.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeFilters.length}
              </span>
            )}
          </Button>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Filters sidebar */}
          {showFilters && (
            <button
              type="button"
              className="fixed inset-0 z-[59] bg-foreground/40 backdrop-blur-sm lg:hidden"
              onClick={() => setShowFilters(false)}
              aria-label={c.closeFilters}
            />
          )}
          <div className={`${showFilters ? "fixed inset-x-0 bottom-0 z-[60] max-h-[92dvh] overflow-y-auto rounded-t-lg bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "hidden"} lg:static lg:order-1 lg:block lg:max-h-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0`}>
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h2 className="font-display text-lg font-bold">{c.filters}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)} aria-label={c.closeFilters}>
                <X className="size-5" />
              </Button>
            </div>
            <div
              className="rounded-lg border border-border bg-card p-5 shadow-card lg:sticky lg:top-24"
            >
              <div className="hidden items-center justify-between gap-2 lg:flex">
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
                      ariaLabel={c.country}
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
                      ariaLabel={c.city}
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
                      ariaLabel={c.specialty}
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
                      ariaLabel={c.jobType}
                      placeholder={c.all}
                      searchPlaceholder={cbx.search}
                      emptyText={cbx.empty}
                    />
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="size-4" /> {c.reset}
                </Button>
                <Button className="w-full lg:hidden" onClick={() => setShowFilters(false)}>
                  {c.applyFilters} · {c.count(items.length)}
                </Button>
              </div>
            </div>
          </div>

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
                  {c.count(total)}
                </h2>
                <FilterBar
                  className="mt-2"
                  filters={activeFilters}
                  onClearAll={reset}
                />
              </div>
              {!signedIn && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/for-facilities">
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
                {appliedSet.size > 0 && (
                   <Button
                    type="button"
                     variant="ghost"
                    onClick={() => setParams({ hideApplied: hideApplied ? "0" : "1" })}
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

            {hasError ? (
              <ErrorState
                className="mt-6"
                error={listError}
                onRetry={() => {
                  void jobsQuery.refetch();
                  void shiftsQuery.refetch();
                }}
              />
            ) : isLoading ? (
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
              <>
                <div className="mt-6 space-y-3">
                  {items.map((item) =>
                    item.kind === "job" ? (
                      <JobCard
                        key={`job-${item.id}`}
                        job={item.job}
                        applied={appliedSet.has(item.id)}
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
                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-sm text-muted-foreground">{c.showing(items.length, total)}</p>
                  {hasMore && (
                    <Button
                      variant="outline"
                      className="min-h-11 w-full sm:w-auto"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? c.loading : c.loadMore}
                    </Button>
                  )}
                  <p className="sr-only" aria-live="polite">
                    {appendedNote}
                  </p>
                </div>
              </>
            )}


          </div>
        </div>
      </section>
    </>
  );
}
