import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, MessageSquare } from "lucide-react";
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
import { COUNTRIES, countryLabel, specialtyName } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/facility/candidates")({
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
      NO_ACTIVE_SUBSCRIPTION: "اشتراكك منتهٍ — جدّد الباقة لاستخدام بحث المرشحين.",
      SEARCH_QUOTA_EXCEEDED: "استهلكت حصة عمليات البحث في باقتك. رقِّ الباقة للمتابعة.",
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
    searchBtn: "ابحث (يخصم من حصة الباقة)",
    noResults: "لا توجد نتائج مطابقة",
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
      NO_ACTIVE_SUBSCRIPTION: "Your subscription has expired — renew your plan to use candidate search.",
      SEARCH_QUOTA_EXCEEDED: "You've used up your plan's search quota. Upgrade your plan to continue.",
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
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState(ANY);
  const [country, setCountry] = useState(ANY);
  const [city, setCity] = useState("");
  const [minExp, setMinExp] = useState("");
  const [results, setResults] = useState<Candidate[] | null>(null);

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      return data ?? [];
    },
  });

  const { data: facility } = useQuery({
    queryKey: ["my-facility", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("facilities")
        .select("id,name_ar")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: quota, refetch: refetchQuota } = useQuery({
    queryKey: ["search-quota", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data } = await supabase
        .from("facility_subscriptions")
        .select("searches_used,plan_code,subscription_plans(candidate_searches,name_ar)")
        .eq("facility_id", facility!.id)
        .maybeSingle();
      return data;
    },
  });

  const search = useMutation({
    mutationFn: async () => {
      const args: {
        _specialty_id?: string;
        _country?: string;
        _city?: string;
        _min_experience?: number;
        _limit?: number;
      } = { _limit: 20 };
      if (specialty !== ANY) args._specialty_id = specialty;
      if (country !== ANY) args._country = country;
      if (city.trim()) args._city = city.trim();
      if (minExp) args._min_experience = Number(minExp);
      const { data, error } = await supabase.rpc("search_candidates", args);
      if (error) {
        const key = error.message.replace(/.*?(NOT_A_FACILITY|NO_ACTIVE_SUBSCRIPTION|SEARCH_QUOTA_EXCEEDED).*/s, "$1") as keyof typeof c.errors;
        throw new Error(c.errors[key] ?? c.searchFailed);
      }
      await supabase.rpc("consume_candidate_search");
      return (data ?? []) as Candidate[];
    },
    onSuccess: (rows) => {
      setResults(rows);
      refetchQuota();
      if (rows.length === 0) toast.info(c.noResults);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startChat = useMutation({
    mutationFn: async (candidateUserId: string) => {
      if (!facility) throw new Error(c.completeFacility);
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("facility_id", facility.id)
        .eq("professional_user_id", candidateUserId)
        .is("job_id", null)
        .maybeSingle();
      if (existing) return;
      const { error } = await supabase.from("conversations").insert({
        facility_id: facility.id,
        professional_user_id: candidateUserId,
        subject: c.initialContact,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.chatOpened);
      navigate({ to: "/messages" });
    },
    onError: () => toast.error(c.chatFailed),
  });

  const plan = quota?.subscription_plans;
  const remaining =
    plan && typeof quota?.searches_used === "number"
      ? Math.max(plan.candidate_searches - quota.searches_used, 0)
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.subtitle}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {remaining !== null && (
            <span>
              {c.remaining} <strong className="text-foreground">{remaining}</strong>
            </span>
          )}
          <Link to="/facility" className="ms-4 text-primary underline">{c.back}</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-4">
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger><SelectValue placeholder={c.specialty} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{c.allSpecialties}</SelectItem>
            {specialties?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{specialtyName(s, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger><SelectValue placeholder={c.country} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{c.allCountries}</SelectItem>
            {COUNTRIES.map((x) => (
              <SelectItem key={x} value={x}>{countryLabel(x, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder={c.city} value={city} onChange={(e) => setCity(e.target.value)} />
        <Input
          type="number"
          min={0}
          placeholder={c.minExpPlaceholder}
          value={minExp}
          onChange={(e) => setMinExp(e.target.value)}
        />
        <Button className="md:col-span-4" onClick={() => search.mutate()} disabled={search.isPending}>
          <Search className="size-4" /> {search.isPending ? c.searching : c.searchBtn}
        </Button>
      </div>

      {results && (
        <ul className="mt-6 space-y-4">
          {results.map((cand) => (
            <li key={cand.id} className="card-lift rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-bold">
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
                <Button size="sm" onClick={() => startChat.mutate(cand.user_id)} disabled={startChat.isPending}>
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
