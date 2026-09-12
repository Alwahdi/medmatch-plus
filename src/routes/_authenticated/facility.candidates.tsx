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
import { COUNTRIES } from "@/lib/format";

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

const ERRORS: Record<string, string> = {
  NOT_A_FACILITY: "هذه الميزة متاحة لحسابات المنشآت فقط.",
  NO_ACTIVE_SUBSCRIPTION: "اشتراكك منتهٍ — جدّد الباقة لاستخدام بحث المرشحين.",
  SEARCH_QUOTA_EXCEEDED: "استهلكت حصة عمليات البحث في باقتك. رقِّ الباقة للمتابعة.",
};

function Candidates() {
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
      const { data } = await supabase.from("specialties").select("id,name_ar").order("name_ar");
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
      const { data, error } = await supabase.rpc("search_candidates", {
        _specialty_id: specialty === ANY ? undefined : specialty,
        _country: country === ANY ? undefined : country,
        _city: city.trim() ? city.trim() : undefined,
        _min_experience: minExp ? Number(minExp) : undefined,
        _limit: 20,
      });
      if (error) throw new Error(ERRORS[error.message.replace(/.*?(NOT_A_FACILITY|NO_ACTIVE_SUBSCRIPTION|SEARCH_QUOTA_EXCEEDED).*/s, "$1")] ?? "تعذّر تنفيذ البحث");
      await supabase.rpc("consume_candidate_search");
      return (data ?? []) as Candidate[];
    },
    onSuccess: (rows) => {
      setResults(rows);
      refetchQuota();
      if (rows.length === 0) toast.info("لا توجد نتائج مطابقة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startChat = useMutation({
    mutationFn: async (candidateUserId: string) => {
      if (!facility) throw new Error("أكمل بيانات المنشأة أولاً");
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
        subject: "تواصل مبدئي",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح");
      navigate({ to: "/messages" });
    },
    onError: () => toast.error("تعذّر بدء المحادثة"),
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
          <h1 className="font-display text-3xl font-extrabold">بحث المرشحين</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            هوية المرشح الكاملة تظهر بعد بدء المحادثة معه.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {remaining !== null && (
            <span>
              المتبقي من حصة البحث: <strong className="text-foreground">{remaining}</strong>
            </span>
          )}
          <Link to="/facility" className="ms-4 text-primary underline">رجوع للوحة</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-4">
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger><SelectValue placeholder="التخصص" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>كل التخصصات</SelectItem>
            {specialties?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger><SelectValue placeholder="الدولة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>كل الدول</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="المدينة" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input
          type="number"
          min={0}
          placeholder="أقل خبرة (سنوات)"
          value={minExp}
          onChange={(e) => setMinExp(e.target.value)}
        />
        <Button className="md:col-span-4" onClick={() => search.mutate()} disabled={search.isPending}>
          <Search className="size-4" /> {search.isPending ? "جارٍ البحث..." : "ابحث (يخصم من حصة الباقة)"}
        </Button>
      </div>

      {results && (
        <ul className="mt-6 space-y-4">
          {results.map((c) => (
            <li key={c.id} className="card-lift rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-bold">
                    مرشح في {specialties?.find((s) => s.id === c.specialty_id)?.name_ar ?? "تخصص طبي"}
                    {c.is_verified && (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" /> موثّق
                      </Badge>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.headline ?? "—"} · خبرة {c.years_experience} سنة ·{" "}
                    {[c.city, c.country].filter(Boolean).join("، ")}
                    {c.is_open_to_shifts ? " · متاح للمناوبات" : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => startChat.mutate(c.user_id)} disabled={startChat.isPending}>
                  <MessageSquare className="size-4" /> تواصل
                </Button>
              </div>
              {c.bio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.bio}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
