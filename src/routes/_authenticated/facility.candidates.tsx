import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, specialtyName, experienceLabel } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { canonicalCountry } from "@/lib/countries";
import { countryOptions } from "@/lib/geo";
import { filterCityOptionsFrom, useLocations } from "@/lib/locations";
import { FilterBar, type ActiveFilter } from "@/components/filter-bar";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";
import { WorkspaceHeading } from "@/components/workspace-ui";
import { subscriptionAllowsAccess, subscriptionLifecycle } from "@/components/panels/facility.shared";
import { UserFacingError } from "@/lib/user-errors";

type CandidatesSearch = { specialty?: string; country?: string; city?: string; minExp?: string };

export const Route = createFileRoute("/_authenticated/facility/candidates")({
  validateSearch: (search: Record<string, unknown>): CandidatesSearch => {
    const out: CandidatesSearch = {};
    for (const k of ["specialty", "country", "city", "minExp"] as const) {
      const v = search[k];
      if (typeof v === "string" && v) out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "بحث المرشحين | SyndeoCare" },
      {
        name: "description",
        content: "ابحث عن كوادر طبية حسب التخصص والخبرة والموقع، وتواصل معهم مباشرة من لوحة منشأتك.",
      },
      { property: "og:title", content: "بحث المرشحين | SyndeoCare" },
      { property: "og:description", content: "قاعدة كوادر طبية قابلة للبحث للمنشآت المشتركة." },
    ],
  }),
  component: Candidates,
});

const ANY = "any";

// Pre-contact results carry only the opaque professional-profile id, never an auth user id.
type Candidate = {
  id: string;
  specialty_id: string | null;
  years_experience: number;
  country: string | null;
  city: string | null;
  is_open_to_shifts: boolean;
  is_verified: boolean;
};


const TXT = {
  ar: {
    errors: {
      NOT_A_FACILITY: "هذه الميزة متاحة لحسابات المنشآت فقط.",
      NO_ACTIVE_SUBSCRIPTION: "البحث متوقف مؤقتاً لهذا الحساب — تواصل مع الدعم للمساعدة.",
      SEARCH_QUOTA_EXCEEDED: "استهلكت حصة البحث التجريبية. تواصل مع الدعم إذا كنت تحتاج متابعة البحث.",
    },
    searchFailed: "تعذّر تنفيذ البحث",
    subNoteExpired: "انتهت مدة وصولك، فتوقف البحث عن مرشحين. تواصل مع الدعم لإعادة التفعيل.",
    subNoteInactive: "وصول هذا الحساب غير نشط حالياً، فالبحث عن مرشحين متوقف. تواصل مع الدعم للمراجعة.",
    subNoteNone: "لا يوجد اشتراك مرتبط بهذه المنشأة بعد، لذا البحث عن مرشحين غير متاح. تواصل مع الدعم لتفعيل الوصول.",
    title: "بحث المرشحين",
    subtitle: "هوية المرشح الكاملة تظهر بعد بدء المحادثة معه.",
    remaining: "المتبقي من حصة البحث:",
    back: "رجوع للوحة",
    specialty: "التخصص",
    allSpecialties: "كل التخصصات",
    country: "الدولة",
    allCountries: "كل الدول",
    city: "المدينة",
    minExpPlaceholder: "أقل خبرة (سنوات)",
    searching: "جارٍ البحث...",
    searchBtn: "ابحث (يُحتسب من حد الاستخدام)",
    noResults: "لا توجد نتائج مطابقة",
    widenHint: "جرّب إزالة فلتر المدينة أو التخصص، أو قلّل سنوات الخبرة.",
    candidateIn: (spec: string) => `مرشح في ${spec}`,
    genericSpecialty: "تخصص طبي",
    verified: "موثّق",
    notVerified: "لم يُوثَّق بعد",
    experience: (n: number) => experienceLabel(n, "ar"),
    openToShifts: " · متاح للمناوبات",
    contact: "تواصل",
    chatOpened: "تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح",
    chatFailed: "تعذّر بدء المحادثة",
    completeFacility: "أكمل بيانات المنشأة أولاً",
    initialContact: "تواصل مبدئي",
    anonymousNote: "الاسم والصورة والنبذة تظهر بعد بدء المحادثة.",
    lockedTitle: "وثّق منشأتك لاستخدام البحث عن المرشحين",
    lockedBody: "البحث عن الكوادر والتواصل معهم مباشرة متاح للمنشآت الموثّقة فقط. ارفع وثائق منشأتك وبعد اعتمادها يُفتح البحث. لن يُحتسب أي بحث من حصتك قبل ذلك.",
    lockedApplicants: "في هذه الأثناء يمكنك استقبال المتقدمين على وظائفك ومناوباتك وإدارتهم من صفحة المتقدمين كالمعتاد.",
    lockedCta: "توثيق المنشأة",
    lockedApplicantsCta: "المتقدمون",
  },
  en: {
    errors: {
      NOT_A_FACILITY: "This feature is available for facility accounts only.",
      NO_ACTIVE_SUBSCRIPTION: "Search is temporarily paused for this account — contact support for help.",
      SEARCH_QUOTA_EXCEEDED: "You've used the trial search allowance. Contact support if you need to continue.",
    },
    searchFailed: "Failed to run the search",
    subNoteExpired: "Your access period ended, so candidate search is paused. Contact support to reactivate.",
    subNoteInactive: "This account's access is not active right now, so candidate search is paused. Contact support for a review.",
    subNoteNone: "No subscription is linked to this facility yet, so candidate search is unavailable. Contact support to activate access.",
    title: "Candidate search",
    subtitle: "The candidate's full identity is revealed once you start a conversation.",
    remaining: "Remaining search quota:",
    back: "Back to dashboard",
    specialty: "Specialty",
    allSpecialties: "All specialties",
    country: "Country",
    allCountries: "All countries",
    city: "City",
    minExpPlaceholder: "Minimum experience (years)",
    searching: "Searching...",
    searchBtn: "Search (uses one search from your quota)",
    noResults: "No matching results",
    widenHint: "Try removing the city or specialty filter, or lower the years of experience.",
    candidateIn: (spec: string) => `Candidate in ${spec}`,
    genericSpecialty: "medical specialty",
    verified: "Verified",
    notVerified: "Not yet verified",
    experience: (n: number) => experienceLabel(n, "en"),
    openToShifts: " · Available for shifts",
    contact: "Contact",
    chatOpened: "Conversation opened — your facility name is now visible to the candidate",
    chatFailed: "Failed to start conversation",
    completeFacility: "Complete your facility profile first",
    initialContact: "Initial contact",
    anonymousNote: "Name, photo and bio appear after you start the conversation.",
    lockedTitle: "Verify your facility to use candidate search",
    lockedBody: "Searching professionals and contacting them directly is for verified facilities only. Upload your facility documents and search opens once they are approved. Nothing is deducted from your search allowance until then.",
    lockedApplicants: "In the meantime you can keep receiving and managing applicants to your jobs and shifts from the Applicants page as usual.",
    lockedCta: "Facility verification",
    lockedApplicantsCta: "Applicants",
  },
} as const;

function Candidates() {
  const { lang } = useLang();
  const { data: locationRows } = useLocations();
  const cbx = comboText(lang);
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const sp = Route.useSearch();
  const setParams = (next: Partial<CandidatesSearch>) => {
    const merged: CandidatesSearch = { ...sp, ...next };
    for (const k of Object.keys(merged) as (keyof CandidatesSearch)[]) {
      if (!merged[k] || merged[k] === ANY) delete merged[k];
    }
    void navigate({ to: "/facility/candidates", search: merged, replace: true });
  };
  const specialty = sp.specialty ?? ANY;
  const country = sp.country ? (canonicalCountry(sp.country) || ANY) : ANY;
  const city = sp.city ?? "";
  const minExp = sp.minExp ?? "";
  const setSpecialty = (v: string) => setParams({ specialty: v });
  const setCity = (v: string) => setParams({ city: v });
  const setMinExp = (v: string) => setParams({ minExp: v });
  const [results, setResults] = useState<Candidate[] | null>(null);

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: facility } = useQuery({
    queryKey: ["my-facility", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("id,name_ar,is_verified")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: quota, isPending: quotaPending, refetch: refetchQuota } = useQuery({
    queryKey: ["search-quota", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facility_subscriptions")
        .select("status,ends_at,searches_used,plan_code,subscription_plans(candidate_searches,name_ar,is_trial)")
        .eq("facility_id", facility!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const search = useMutation({
    mutationFn: async () => {
      const args: {
        _request_id: string;
        _specialty_id?: string;
        _country?: string;
        _city?: string;
        _min_experience?: number;
        _limit?: number;
      } = { _request_id: crypto.randomUUID(), _limit: 20 };
      if (specialty !== ANY) args._specialty_id = specialty;
      if (country !== ANY) args._country = country;
      if (city.trim()) args._city = city.trim();
      if (minExp) args._min_experience = Number(minExp);
      const { data, error } = await supabase.rpc("search_candidates_idempotent", args);
      if (error) {
        const key = error.message.replace(/.*?(NOT_A_FACILITY|NO_ACTIVE_SUBSCRIPTION|SEARCH_QUOTA_EXCEEDED).*/s, "$1") as keyof typeof c.errors;
        throw new UserFacingError(c.errors[key] ?? c.searchFailed);
      }
      return (data ?? []) as Candidate[];
    },
    onSuccess: (rows) => {
      setResults(rows);
      refetchQuota();
      if (rows.length === 0) toast.info(c.noResults);
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang)),
  });

  const startChat = useMutation({
    mutationFn: async (candidateId: string) => {
      if (!facility) throw new UserFacingError(c.completeFacility);
      const { error } = await supabase.rpc("start_candidate_conversation_from_search", {
        _candidate_id: candidateId,
        _subject: c.initialContact,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.chatOpened);
      navigate({ to: "/messages" });
    },
    onError: (e: Error, candidateId) => {
      toast.error(friendlyError(e, lang, c.chatFailed));
      // سباق: المرشح قد يكون أوقف ظهوره بعد تحميل النتائج — أزِله من القائمة.
      if (/CANDIDATE_NO_LONGER_SEARCHABLE|CANDIDATE_SEARCH_ACCESS_EXPIRED|CANDIDATE_CONTACT_NOT_ALLOWED/i.test(e.message)) {
        setResults((rows) => (rows ? rows.filter((r) => r.id !== candidateId) : rows));
      }
    },
  });


  const activeFilters: ActiveFilter[] = [
    specialty !== ANY
      ? {
          key: "specialty",
          label: specialtyName((specialties ?? []).find((s) => s.id === specialty), lang) ?? c.specialty,
          onClear: () => setSpecialty(ANY),
        }
      : null,
    country !== ANY
      ? { key: "country", label: countryLabel(country, lang), onClear: () => setParams({ country: "", city: "" }) }
      : null,
    city ? { key: "city", label: city, onClear: () => setCity("") } : null,
    minExp ? { key: "minExp", label: `${minExp}+`, onClear: () => setMinExp("") } : null,
  ].filter(Boolean) as ActiveFilter[];

  const subState = subscriptionLifecycle(quota, quota?.subscription_plans?.is_trial);
  // Never claim "no access" before the plan state is known.
  const planStateKnown = !!facility && !quotaPending;
  const searchAllowed = !planStateKnown || subscriptionAllowsAccess(subState);
  const subStateNote = !planStateKnown ? null :
    subState === "expired" ? c.subNoteExpired
    : subState === "inactive" ? c.subNoteInactive
    : subState === "none" ? c.subNoteNone
    : null;
  const plan = quota?.subscription_plans;
  const remaining =
    plan && typeof quota?.searches_used === "number"
      ? Math.max(plan.candidate_searches - quota.searches_used, 0)
      : null;

  // بوابة التوثيق: البحث الاستباقي عن الكوادر للمنشآت الموثّقة فقط.
  if (facility && !facility.is_verified) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <WorkspaceHeading title={c.title} description={c.subtitle} />
        <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            {c.lockedTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.lockedBody}</p>
          <p className="mt-2 text-sm text-muted-foreground">{c.lockedApplicants}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild className="min-h-11">
              <Link to="/facility/verification">{c.lockedCta}</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/facility" search={{ tab: "applicants" }}>{c.lockedApplicantsCta}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <WorkspaceHeading title={c.title} description={c.subtitle} action={<div className="text-sm text-muted-foreground">
          {remaining !== null && (
            <span>
              {c.remaining} <strong className="text-foreground">{remaining}</strong>
            </span>
          )}
          <Link to="/facility" className="ms-4 text-primary underline">{c.back}</Link>
        </div>} />

      <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-4 shadow-card sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <Combobox
          options={[
            { value: ANY, label: c.allSpecialties },
            ...(specialties ?? []).map((s) => ({
              value: s.id,
              label: specialtyName(s, lang) ?? s.name_ar,
              keywords: [s.name_ar, s.name_en].filter(Boolean) as string[],
            })),
          ]}
          value={specialty}
          onChange={setSpecialty}
          placeholder={c.specialty}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
        />
        <Combobox
          options={[{ value: ANY, label: c.allCountries }, ...countryOptions(lang)]}
          value={country}
          onChange={(v) => setParams({ country: v, city: "" })}
          placeholder={c.country}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
        />
        <Combobox
          options={filterCityOptionsFrom(locationRows, country === ANY ? "" : country, lang)}
          value={city}
          onChange={setCity}
          placeholder={c.city}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
          allowCustom
          customLabel={cbx.add}
        />
        <Input aria-label={c.minExpPlaceholder}
          type="number"
          min={0}
          placeholder={c.minExpPlaceholder}
          value={minExp}
          onChange={(e) => setMinExp(e.target.value)}
        />
        <Button
          className="w-full sm:col-span-2 md:col-span-4"
          onClick={() => search.mutate()}
          loading={search.isPending}
          disabled={!searchAllowed}
        >
          <Search className="size-4" /> {search.isPending ? c.searching : c.searchBtn}
        </Button>
      </div>

      {subStateNote && (
        <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{subStateNote}</p>
      )}

      {activeFilters.length > 0 && (
        <FilterBar
          className="mt-4"
          filters={activeFilters}
          onClearAll={() => void navigate({ to: "/facility/candidates", search: {}, replace: true })}
        />
      )}

      {results && results.length === 0 && (
        <EmptyState
          className="mt-6"
          icon={Search}
          title={c.noResults}
          description={c.widenHint}
          action={
            activeFilters.length > 0 ? (
              <Button
                variant="outline"
                onClick={() => void navigate({ to: "/facility/candidates", search: {}, replace: true })}
              >
                {lang === "ar" ? "مسح كل الفلاتر" : "Clear all filters"}
              </Button>
            ) : undefined
          }
        />
      )}

      {results && results.length > 0 && (
        <ul className="mt-6 space-y-4">
          {results.map((cand) => (
            <li key={cand.id} className="card-lift rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    {c.candidateIn(specialtyName(specialties?.find((s) => s.id === cand.specialty_id), lang) || c.genericSpecialty)}
                    {cand.is_verified ? (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" /> {c.verified}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {c.notVerified}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.experience(cand.years_experience)} ·{" "}
                    {[cand.city, countryLabel(cand.country, lang)].filter(Boolean).join("، ")}
                    {cand.is_open_to_shifts ? c.openToShifts : ""}
                  </p>
                </div>
                <Button size="sm" className="w-full sm:w-auto" onClick={() => startChat.mutate(cand.id)} loading={startChat.isPending}>
                  <MessageSquare className="size-4" /> {c.contact}
                </Button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">{c.anonymousNote}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
