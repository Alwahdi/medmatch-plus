import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, CalendarClock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useSpecialtyScope, inScope, type Scope } from "@/lib/specialty-filter";
import { labelCityWithCountry } from "@/lib/geo";
import { matchesQuery } from "@/lib/search";
import { FilterBar, type ActiveFilter } from "@/components/filter-bar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSignedIn } from "@/components/page-chrome";
import { countryLabel, specialtyName } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { useLang } from "@/lib/i18n";

type ShiftsSearch = { q?: string; country?: string; city?: string };

export const Route = createFileRoute("/_public/shifts/")({
  validateSearch: (search: Record<string, unknown>): ShiftsSearch => {
    const out: ShiftsSearch = {};
    for (const k of ["q", "country", "city"] as const) {
      const v = search[k];
      if (typeof v === "string" && v) out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "سوق المناوبات الطبية الفورية | SyndeoCare" },
      {
        name: "description",
        content:
          "احجز مناوبة طبية فورية بأجر بالساعة معلن في مستشفيات وعيادات اليمن والمنطقة العربية — تمريض، طوارئ، صيدلة، أسنان وأشعة.",
      },
      { property: "og:title", content: "سوق المناوبات الطبية | SyndeoCare" },
      { property: "og:description", content: "مناوبات طبية متاحة للحجز الفوري بأجر بالساعة معلن." },
    ],
  }),
  component: ShiftsPage,
});

const ALL = "all";

const TXT = {
  ar: {
    badge: "شيفتات فورية بأجر بالساعة",
    title: "سوق المناوبات الطبية",
    sub: "مناوبات معلنة بأجر واضح في مستشفيات وعيادات المنطقة العربية — احجزها مباشرة بدون وسيط.",
    pick: "اختر الدولة",
    allCountries: "كل الدول",
    allCities: "كل المدن",
    searchPlaceholder: "ابحث بعنوان المناوبة أو المدينة",
    label: "متاحة للحجز",
    count: (n: number) => `${n} مناوبة متاحة`,
    employer: "أنت ناشر شيفتات؟",
    empty: "لا توجد مناوبات متاحة حالياً.",
    showAll: "عرض كل الدول",
    guest: "سجّل دخولك لحجز المناوبات ومتابعة جدولك.",
    signIn: "تسجيل الدخول",
    booked: "تم حجز المناوبة — ستجدها في صفحة مناوباتي",
    failed: "تعذّر الحجز، ربما حُجزت المناوبة للتو",
    scopeMine: (n: string) => `تخصصي: ${n}`,
    scopeField: "مجالي الطبي",
    scopeAll: "كل التخصصات",
    myHeading: (n: string) => `مناوبات تناسب تخصصك: ${n}`,
    myHeadingPlain: "مناوبات مقترحة لك",
    mySub: "مرتّبة حسب الأقرب موعداً، مع إبراز ما يناسب تخصصك.",

  },
  en: {
    badge: "Instant shifts with hourly pay",
    title: "Medical shift marketplace",
    sub: "Shifts with clearly published pay in hospitals and clinics across the Arab region — book directly, no middleman.",
    pick: "Choose a country",
    allCountries: "All countries",
    allCities: "All cities",
    searchPlaceholder: "Search by shift title or city",
    label: "Open for booking",
    count: (n: number) => `${n} shifts available`,
    employer: "Posting shifts? See plans",
    empty: "No shifts available right now.",
    showAll: "Show all countries",
    guest: "Sign in to book shifts and track your schedule.",
    signIn: "Sign in",
    booked: "Shift booked — you'll find it under My shifts",
    failed: "Booking failed, the shift may have just been taken",
    scopeMine: (n: string) => `My specialty: ${n}`,
    scopeField: "My medical field",
    scopeAll: "All specialties",
    myHeading: (n: string) => `Shifts matching your specialty: ${n}`,
    myHeadingPlain: "Shifts picked for you",
    mySub: "Sorted by the soonest start, highlighting what fits your specialty.",

  },
} as const;

function ShiftsPage() {
  const { lang } = useLang();
  const cbx = comboText(lang);
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sp = Route.useSearch();
  const setParams = (next: Partial<ShiftsSearch>) => {
    const merged: ShiftsSearch = { ...sp, ...next };
    for (const k of Object.keys(merged) as (keyof ShiftsSearch)[]) {
      if (!merged[k] || merged[k] === ALL) delete merged[k];
    }
    void navigate({ to: "/shifts", search: merged, replace: true });
  };
  const q = sp.q ?? "";
  const country = sp.country ?? ALL;
  const city = sp.city ?? ALL;
  const setCity = (v: string) => setParams({ city: v });

  const { data: shifts, isLoading } = useQuery({
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

  const book = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from("shift_bookings")
        .insert({ shift_id: shiftId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.booked);
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
    },
    onError: () => {
      toast.error(c.failed);
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });


  const countries = useMemo(() => Array.from(new Set((shifts ?? []).map((s) => s.country))), [shifts]);
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          (shifts ?? [])
            .filter((s) => country === ALL || s.country === country)
            .map((s) => s.city)
            .filter((x): x is string => Boolean(x)),
        ),
      )
        .sort((a, b) => a.localeCompare(b, lang === "en" ? "en" : "ar"))
        .map((x) => ({
          value: x,
          label: country === ALL ? labelCityWithCountry(x, lang) : x,
          keywords: [x, labelCityWithCountry(x, lang)],
        })),
    [shifts, country, lang],
  );
  const { mySpecialty, mySpecialtyId, fieldIds, hasSpecialty } = useSpecialtyScope();
  const signedIn = useSignedIn();
  const [scope, setScope] = useState<Scope>("all");
  const [scopeTouched, setScopeTouched] = useState(false);
  useEffect(() => {
    if (!scopeTouched && hasSpecialty) setScope("field");
  }, [hasSpecialty, scopeTouched]);
  const pickScope = (next: Scope) => {
    setScopeTouched(true);
    setScope(next);
  };

  const { data: myShiftIds } = useQuery({
    queryKey: ["my-booked-shift-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_bookings")
        .select("shift_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.shift_id));
    },
  });

  const filtered = (shifts ?? []).filter(
    (s) =>
      (country === ALL || s.country === country) &&
      (city === ALL || s.city === city) &&
      matchesQuery(
        [s.title, s.notes, s.city, s.country, countryLabel(s.country, lang), s.specialties?.name_ar, s.specialties?.name_en],
        q,
      ) &&
      inScope(scope, s.specialty_id, mySpecialtyId, fieldIds),
  );

  const resetFilters = () => {
    pickScope("all");
    void navigate({ to: "/shifts", search: {}, replace: true });
  };

  const activeFilters: ActiveFilter[] = [
    q ? { key: "q", label: q, onClear: () => setParams({ q: "" }) } : null,
    country !== ALL
      ? { key: "country", label: countryLabel(country, lang), onClear: () => setParams({ country: "", city: "" }) }
      : null,
    city !== ALL ? { key: "city", label: city, onClear: () => setCity(ALL) } : null,
  ].filter(Boolean) as ActiveFilter[];


  return (
    <>
      {signedIn ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="section-label">{c.label}</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold">
            {mySpecialty ? c.myHeading(specialtyName(mySpecialty, lang)) : c.myHeadingPlain}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{c.mySub}</p>
        </section>
      ) : (
        /* Hero */
        <section className="page-hero py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
              <CalendarClock className="size-4" />
              {c.badge}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">{c.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">{c.sub}</p>
          </div>
        </section>
      )}


      {/* Filter */}
      <div className={signedIn ? "mt-4" : "relative px-4"}>
        <div className={signedIn ? "max-w-xl" : "mx-auto max-w-xl -translate-y-1/2"}>
          <div className="card-lift flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground end-3" />
              <Input
                value={q}
                onChange={(e) => setParams({ q: e.target.value })}
                placeholder={c.searchPlaceholder}
                className="h-11 pe-9"
                maxLength={80}
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Combobox
                options={[
                  { value: ALL, label: c.allCountries },
                  ...countries.map((x) => ({ value: x, label: countryLabel(x, lang), keywords: [x] })),
                ]}
                value={country}
                onChange={(v) => setParams({ country: v, city: "" })}
                placeholder={c.pick}
                searchPlaceholder={cbx.search}
                emptyText={cbx.empty}
                className="pr-9"
              />
            </div>
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
      </div>

      {/* Results */}
      <section className={signedIn ? "py-6" : "py-16 md:py-20"}>
        <div className={signedIn ? "" : "mx-auto max-w-6xl px-4"}>

          <FilterBar className="mb-4" count={filtered.length} filters={activeFilters} onClearAll={resetFilters} />

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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">{c.label}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">{c.count(filtered.length)}</h2>
            </div>
            {!signedIn && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/pricing">
                  {c.employer} <ArrowLeft className="size-4 ltr:rotate-180" />
                </Link>
              </Button>
            )}

          </div>

          {isLoading ? (
            <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">{c.empty}</p>
              <Button className="mt-4" variant="outline" onClick={resetFilters}>
                {c.showAll}
              </Button>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {filtered.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  busy={book.isPending}
                  mine={!!myShiftIds?.has(shift.id)}
                  recommended={
                    signedIn && !!mySpecialtyId && shift.specialty_id === mySpecialtyId
                  }
                  onBook={() => {
                    if (!user) {
                      navigate({ to: "/auth" });
                      return;
                    }
                    book.mutate(shift.id);
                  }}
                />
              ))}
            </div>
          )}


          {!user && (
            <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted-foreground">{c.guest}</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/auth" })}>
                {c.signIn}
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
