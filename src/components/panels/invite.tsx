import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, CalendarClock, History, Search, Send, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { RemoteAvatar } from "@/components/remote-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, specialtyName } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { Combobox, comboText } from "@/components/ui/combobox";
import { countryOptions, filterCityOptions } from "@/lib/geo";

const ANY = "any";

type Candidate = {
  user_id: string;
  headline: string | null;
  specialty_id: string | null;
  years_experience: number;
  country: string | null;
  city: string | null;
  is_verified: boolean;
};

export const INVITE_TXT = {
  ar: {
    title: "دعوة مختصين",
    subtitle: "أرسل دعوة مباشرة لمختص للانضمام إلى هذه الفرصة، ويمكنه قبولها أو رفضها.",
    back: "رجوع للوحة",
    forJob: "دعوة لوظيفة",
    forShift: "دعوة لمناوبة",
    noTarget: "اختر وظيفة أو مناوبة من لوحة المنشأة ثم اضغط «دعوة مختصين».",
    recent: "مختصون عملوا معك سابقاً",
    recentEmpty: "لا يوجد مختصون سابقون بعد",
    recentEmptyBody: "بعد توظيف مختص أو تأكيد مناوبة معه سيظهر هنا لدعوته بنقرة واحدة.",
    searchTitle: "ابحث عن مختصين جدد",
    specialty: "التخصص",
    allSpecialties: "كل التخصصات",
    country: "الدولة",
    allCountries: "كل الدول",
    city: "المدينة",
    minExp: "أقل خبرة (سنوات)",
    searchBtn: "ابحث (يُحتسب من حد الاستخدام)",
    searching: "جارٍ البحث...",
    noResults: "لا توجد نتائج مطابقة",
    msgLabel: "رسالة الدعوة (اختياري)",
    msgPlaceholder: "مثال: ملفك مناسب لهذه الوظيفة، يسعدنا انضمامك.",
    invite: "إرسال دعوة",
    invited: "تمت الدعوة",
    accepted: "قبل الدعوة",
    declined: "رفض الدعوة",
    sent: "تم إرسال الدعوة",
    failed: "تعذّر إرسال الدعوة",
    duplicate: "سبق أن دعوت هذا المختص لهذه الفرصة",
    verified: "موثّق",
    experience: (n: number) => `خبرة ${n} سنة`,
    sentTitle: "الدعوات المُرسلة",
    statuses: { pending: "بانتظار الرد", accepted: "مقبولة", declined: "مرفوضة", cancelled: "ملغاة" },
    errors: {
      NOT_A_FACILITY: "هذه الميزة متاحة لحسابات المنشآت فقط.",
      NO_ACTIVE_SUBSCRIPTION: "البحث متوقف مؤقتاً لهذا الحساب — تواصل مع الدعم للمساعدة.",
      SEARCH_QUOTA_EXCEEDED: "استهلكت حصة البحث في باقتك.",
    },
    searchFailed: "تعذّر تنفيذ البحث",
  },
  en: {
    title: "Invite professionals",
    subtitle: "Send a direct invitation to a professional for this opportunity; they can accept or decline.",
    back: "Back to dashboard",
    forJob: "Invitation for job",
    forShift: "Invitation for shift",
    noTarget: "Pick a job or shift from your dashboard, then press \"Invite professionals\".",
    recent: "Professionals who worked with you",
    recentEmpty: "No past professionals yet",
    recentEmptyBody: "Once you hire someone or confirm a shift, they appear here for one-click invites.",
    searchTitle: "Find new professionals",
    specialty: "Specialty",
    allSpecialties: "All specialties",
    country: "Country",
    allCountries: "All countries",
    city: "City",
    minExp: "Minimum experience (years)",
    searchBtn: "Search (uses one search from your quota)",
    searching: "Searching...",
    noResults: "No matching results",
    msgLabel: "Invitation message (optional)",
    msgPlaceholder: "e.g. Your profile fits this role, we'd love to have you.",
    invite: "Send invitation",
    invited: "Invited",
    accepted: "Accepted",
    declined: "Declined",
    sent: "Invitation sent",
    failed: "Could not send the invitation",
    duplicate: "You already invited this professional to this opportunity",
    verified: "Verified",
    experience: (n: number) => `${n} years experience`,
    sentTitle: "Sent invitations",
    statuses: { pending: "Pending", accepted: "Accepted", declined: "Declined", cancelled: "Cancelled" },
    errors: {
      NOT_A_FACILITY: "This feature is available for facility accounts only.",
      NO_ACTIVE_SUBSCRIPTION: "Search is temporarily paused for this account — contact support for help.",
      SEARCH_QUOTA_EXCEEDED: "You've used the trial search allowance.",
    },
    searchFailed: "Failed to run the search",
  },
} as const;

/** لوحة دعوة المختصين لإعلان محدد — تُستخدم في الصفحة وداخل لوحة المنشأة. */
export function InvitePanel({ jobId, shiftId }: { jobId?: string | undefined; shiftId?: string | undefined }) {
  const { lang } = useLang();
  const c = INVITE_TXT[lang];
  const cbx = comboText(lang);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
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

  const { data: target } = useQuery({
    queryKey: ["invite-target", jobId, shiftId],
    enabled: !!(jobId || shiftId),
    queryFn: async () => {
      if (jobId) {
        const { data } = await supabase.from("jobs").select("id,title").eq("id", jobId).maybeSingle();
        return data ? { kind: "job" as const, title: data.title } : null;
      }
      const { data } = await supabase.from("shifts").select("id,title").eq("id", shiftId!).maybeSingle();
      return data ? { kind: "shift" as const, title: data.title } : null;
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["past-collaborators", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const [{ data: jobs }, { data: shifts }] = await Promise.all([
        supabase.from("jobs").select("id").eq("facility_id", facility!.id),
        supabase.from("shifts").select("id").eq("facility_id", facility!.id),
      ]);
      const jobIds = (jobs ?? []).map((j) => j.id);
      const shiftIds = (shifts ?? []).map((s) => s.id);
      const ids = new Set<string>();
      if (jobIds.length) {
        const { data } = await supabase
          .from("applications")
          .select("user_id")
          .in("job_id", jobIds)
          .eq("status", "hired");
        for (const a of data ?? []) ids.add(a.user_id);
      }
      if (shiftIds.length) {
        const { data } = await supabase
          .from("shift_bookings")
          .select("user_id")
          .in("shift_id", shiftIds)
          .eq("status", "confirmed");
        for (const b of data ?? []) ids.add(b.user_id);
      }
      if (ids.size === 0) return [];
      const { data: pros } = await supabase
        .from("healthcare_professionals")
        .select("user_id,full_name,headline,specialty_id,years_experience,country,city,is_verified,avatar_url")
        .in("user_id", Array.from(ids));
      return pros ?? [];
    },
  });

  const { data: sentInvites } = useQuery({
    queryKey: ["invitations-sent", facility?.id, jobId, shiftId],
    enabled: !!facility,
    queryFn: async () => {
      let q = supabase
        .from("invitations")
        .select("id,professional_user_id,status,created_at")
        .eq("facility_id", facility!.id);
      q = jobId ? q.eq("job_id", jobId) : shiftId ? q.eq("shift_id", shiftId) : q;
      const { data } = await q.order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const statusOf = (userId: string) =>
    sentInvites?.find((i) => i.professional_user_id === userId)?.status ?? null;

  const search = useMutation({
    mutationFn: async () => {
      const args: {
        _request_id: string;
        _limit: number;
        _specialty_id?: string;
        _country?: string;
        _city?: string;
        _min_experience?: number;
      } = { _request_id: crypto.randomUUID(), _limit: 20 };
      if (specialty !== ANY) args._specialty_id = specialty;
      if (country !== ANY) args._country = country;
      if (city.trim()) args._city = city.trim();
      if (minExp) args._min_experience = Number(minExp);
      const { data, error } = await supabase.rpc("search_candidates_idempotent", args);
      if (error) {
        const key = error.message.replace(
          /.*?(NOT_A_FACILITY|NO_ACTIVE_SUBSCRIPTION|SEARCH_QUOTA_EXCEEDED).*/s,
          "$1",
        ) as keyof typeof c.errors;
        throw new Error(c.errors[key] ?? c.searchFailed);
      }
      return (data ?? []) as Candidate[];
    },
    onSuccess: (rows) => {
      setResults(rows);
      if (rows.length === 0) toast.info(c.noResults);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invite = useMutation({
    mutationFn: async (professionalUserId: string) => {
      if (!facility || (!jobId && !shiftId)) throw new Error(c.noTarget);
      const args: {
        _professional_user_id: string;
        _job_id?: string;
        _shift_id?: string;
        _message?: string;
      } = {
        _professional_user_id: professionalUserId,
      };
      if (jobId) args._job_id = jobId;
      if (shiftId) args._shift_id = shiftId;
      if (message.trim()) args._message = message.trim();
      const { error } = await supabase.rpc("send_candidate_invitation", args);
      if (error) throw new Error(error.message.includes("INVITATION_EXISTS") ? c.duplicate : c.failed);
    },
    onSuccess: () => {
      toast.success(c.sent);
      queryClient.invalidateQueries({ queryKey: ["invitations-sent"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function InviteButton({ userId }: { userId: string }) {
    const st = statusOf(userId);
    if (st === "accepted") return <Badge className="bg-success text-success-foreground">{c.accepted}</Badge>;
    if (st === "declined") return <Badge variant="secondary">{c.declined}</Badge>;
    if (st === "pending") return <Badge variant="secondary">{c.invited}</Badge>;
    return (
      <Button
        size="sm"
        disabled={invite.isPending || (!jobId && !shiftId)}
        onClick={() => invite.mutate(userId)}
      >
        <Send className="size-4" /> {c.invite}
      </Button>
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-border bg-card p-5 shadow-card">
        {target ? (
          <p className="flex flex-wrap items-center gap-2 font-bold">
            {target.kind === "job" ? (
              <Briefcase className="size-4 text-primary" />
            ) : (
              <CalendarClock className="size-4 text-primary" />
            )}
            <span className="text-muted-foreground">
              {target.kind === "job" ? c.forJob : c.forShift}:
            </span>
            {target.title}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{c.noTarget}</p>
        )}
        <label className="mt-4 block text-sm font-semibold">{c.msgLabel}</label>
        <Textarea
          className="mt-1"
          rows={2}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={c.msgPlaceholder}
        />
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
          <History className="size-5 text-primary" /> {c.recent}
        </h2>
        {recent?.length ? (
          <ul className="mt-4 space-y-3">
            {recent.map((p) => (
              <li
                key={p.user_id}
                 className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card"
              >
                 <RemoteAvatar value={p.avatar_url} icon={UserRound} className="size-10 rounded-lg" />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-bold">
                    {p.full_name}
                    {p.is_verified && <ShieldCheck className="size-3.5 text-accent" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.headline ?? specialtyName(specialties?.find((s) => s.id === p.specialty_id), lang)} ·{" "}
                    {c.experience(p.years_experience)} ·{" "}
                    {[p.city, countryLabel(p.country, lang)].filter(Boolean).join("، ")}
                  </p>
                </div>
                <div className="ms-auto">
                  <InviteButton userId={p.user_id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState icon={History} title={c.recentEmpty} description={c.recentEmptyBody} />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
          <Search className="size-5 text-primary" /> {c.searchTitle}
        </h2>
        <div className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-4">
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
            onChange={(v) => { setCountry(v); setCity(""); }}
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
            placeholder={c.minExp}
            value={minExp}
            onChange={(e) => setMinExp(e.target.value)}
          />
          <Button className="md:col-span-4" onClick={() => search.mutate()} loading={search.isPending}>
            <Search className="size-4" /> {search.isPending ? c.searching : c.searchBtn}
          </Button>
        </div>

        {results && (
          <ul className="mt-4 space-y-3">
            {results.map((cand) => (
              <li
                key={cand.user_id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <RemoteAvatar value={null} icon={UserRound} className="size-10 rounded-lg" />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-bold">
                    {specialtyName(specialties?.find((s) => s.id === cand.specialty_id), lang)}
                    {cand.is_verified && (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" /> {c.verified}
                      </Badge>
                    )}
                  </p>
                  {cand.headline && <p className="truncate text-sm text-muted-foreground">{cand.headline}</p>}
                  <p className="truncate text-xs text-muted-foreground">
                    {c.experience(cand.years_experience)} ·{" "}
                    {[cand.city, countryLabel(cand.country, lang)].filter(Boolean).join("، ")}
                  </p>
                </div>
                <div className="ms-auto">
                  <InviteButton userId={cand.user_id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sentInvites?.length ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-extrabold">{c.sentTitle}</h2>
          <ul className="mt-4 space-y-2">
            {sentInvites.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <Link
                  to="/facility/candidates/$userId"
                  params={{ userId: i.professional_user_id }}
                  className="text-primary underline underline-offset-4"
                >
                  {i.professional_user_id.slice(0, 8)}…
                </Link>
                <Badge variant={i.status === "accepted" ? "default" : "secondary"}>
                  {c.statuses[i.status as keyof typeof c.statuses]}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
