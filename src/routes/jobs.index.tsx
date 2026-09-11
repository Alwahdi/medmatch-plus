import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { matchScore } from "@/lib/match";
import { EMPLOYMENT_LABELS } from "@/lib/format";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "الوظائف الطبية | SyndeoCare" },
      {
        name: "description",
        content:
          "تصفح وظائف الأطباء والتمريض والصيادلة والفنيين في السعودية والإمارات ومصر والخليج، مع نطاق راتب معلن ونسبة توافق لكل وظيفة.",
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

function JobsPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState(ALL);
  const [specialty, setSpecialty] = useState(ALL);
  const [type, setType] = useState(ALL);
  const { user } = useSession();

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar").order("name_ar");
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
          "id,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,specialty_id,required_license,facilities(name_ar,is_verified),specialties(name_ar)",
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

  const { data: profile } = useQuery({
    queryKey: ["my-pro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("healthcare_professionals")
        .select("specialty_id,years_experience,country,license_country")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const countries = useMemo(
    () => Array.from(new Set((jobs ?? []).map((j) => j.country))),
    [jobs],
  );

  const filtered = (jobs ?? []).filter((j) => {
    if (country !== ALL && j.country !== country) return false;
    if (specialty !== ALL && j.specialty_id !== specialty) return false;
    if (type !== ALL && j.employment_type !== type) return false;
    if (q && !`${j.title} ${j.facilities?.name_ar ?? ""} ${j.city}`.includes(q)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">الوظائف الطبية</h1>
      <p className="mt-2 text-muted-foreground">
        {filtered.length} وظيفة متاحة من منشآت صحية في المنطقة العربية.
      </p>

      <div className="card-lift mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالمسمى أو المنشأة أو المدينة"
              className="pr-9"
              maxLength={80}
            />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="الدولة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل الدول</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger><SelectValue placeholder="التخصص" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل التخصصات</SelectItem>
              {specialties?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Button
            variant={type === ALL ? "default" : "outline"}
            size="sm"
            onClick={() => setType(ALL)}
          >
            كل الأنواع
          </Button>
          {Object.entries(EMPLOYMENT_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={type === key ? "default" : "outline"}
              size="sm"
              onClick={() => setType(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">لا توجد وظائف مطابقة لبحثك.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
  );
}
