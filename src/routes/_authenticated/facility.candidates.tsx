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
import { countryLabel, specialtyName } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { countryOptions, filterCityOptions } from "@/lib/geo";
import { FilterBar, type ActiveFilter } from "@/components/filter-bar";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";
import { WorkspaceHeading } from "@/components/workspace-ui";

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

type Candidate = {
  id: string;
  user_id: string;
  headline: string | null;
  specialty_id: string | null;
  years_experience: number;
  country: string | null;
  city: string | null;
  bio: string | null;
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
    experience: (n: number) => `خبرة ${n} سنة`,
    openToShifts: " · متاح للمناوبات",
    contact: "تواصل",
    chatOpened: "تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح",
    chatFailed: "تعذّر بدء المحادثة",
    completeFacility: "أكمل بيانات المنشأة أولاً",
    initialContact: "تواصل مبدئي",
  },
  en: {
    errors: {
      NOT_A_FACILITY: "This feature is available for facility accounts only.",
      NO_ACTIVE_SUBSCRIPTION: "Search is temporarily paused for this account — contact support for help.",
      SEARCH_QUOTA_EXCEEDED: "You've used the trial search allowance. Contact support if you need to continue.",
    },
    searchFailed: "Failed to run the search",
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
    experience: (n: number) => `${n} years experience`,
    openToShifts: " · Available for shifts",
    contact: "Contact",
    chatOpened: "Conversation opened — your facility name is now visible to the candidate",
    chatFailed: "Failed to start conversation",
    completeFacility: "Complete your facility profile first",
    initialContact: "Initial contact",
  },
} as const;

function Candidates() {
  const { lang } = useLang();
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
  const country = sp.country ?? ANY;
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
        .select("id,name_ar")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: quota, refetch: refetchQuota } = useQuery({
    queryKey: ["search-quota", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facility_subscriptions")
        .select("searches_used,plan_code,subscription_plans(candidate_searches,name_ar)")
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
        throw new Error(c.errors[key] ?? c.searchFailed);
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
    mutationFn: async (candidateUserId: string) => {
      if (!facility) throw new Error(c.completeFacility);
      const { error } = await supabase.rpc("start_candidate_conversation", {
        _professional_user_id: candidateUserId,
        _subject: c.initialContact,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.chatOpened);
      navigate({ to: "/messages" });
    },
    onError: () => toast.error(c.chatFailed),
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

  const plan = quota?.subscription_plans;
  const remaining =
    plan && typeof quota?.searches_used === "number"
      ? Math.max(plan.candidate_searches - quota.searches_used, 0)
      : null;

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
          options={filterCityOptions(country === ANY ? "" : country, lang)}
          value={city}
          onChange={setCity}
          placeholder={c.city}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
          allowCustom
          customLabel={cbx.add}
        />
        <Input
          type="number"
          min={0}
          placeholder={c.minExpPlaceholder}
          value={minExp}
          onChange={(e) => setMinExp(e.target.value)}
        />
        <Button className="w-full sm:col-span-2 md:col-span-4" onClick={() => search.mutate()} loading={search.isPending}>
          <Search className="size-4" /> {search.isPending ? c.searching : c.searchBtn}
        </Button>
      </div>

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
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {c.candidateIn(specialtyName(specialties?.find((s) => s.id === cand.specialty_id), lang) || c.genericSpecialty)}
                    {cand.is_verified && (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" /> {c.verified}
                      </Badge>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cand.headline ?? "—"} · {c.experience(cand.years_experience)} ·{" "}
                    {[cand.city, countryLabel(cand.country, lang)].filter(Boolean).join("، ")}
                    {cand.is_open_to_shifts ? c.openToShifts : ""}
                  </p>
                </div>
                <Button size="sm" className="w-full sm:w-auto" onClick={() => startChat.mutate(cand.user_id)} loading={startChat.isPending}>
                  <MessageSquare className="size-4" /> {c.contact}
                </Button>
              </div>

              {cand.bio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cand.bio}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
