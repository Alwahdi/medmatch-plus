import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowLeft, Briefcase } from "lucide-react";
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
          "id,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialty_id,required_license,specialties(name_ar)",
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
    if (q && !`${j.title} ${j.specialties?.name_ar ?? ""} ${j.city}`.includes(q)) return false;
    return true;
  });

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <Briefcase className="size-4" />
            وظائف دائمة من منشآت موثّقة
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">
            الوظائف الطبية المفتوحة
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            فرص دائمة لأطباء، تمريض، صيادلة، وفنيين في السعودية والإمارات ومصر والخليج — بنطاق راتب
            معلن ومطابقة ذكية.
          </p>
        </div>
      </section>

      {/* Search & filters */}
      <div className="relative px-4">
        <div className="mx-auto max-w-5xl -translate-y-1/2">
          <div className="card-lift rounded-2xl border border-border bg-card p-3 shadow-lg">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_160px_160px]">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث بالمسمى أو التخصص أو المدينة"
                  className="h-11 pr-9"
                  maxLength={80}
                />
              </div>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="الدولة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>كل الدول</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="التخصص" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>كل التخصصات</SelectItem>
                  {specialties?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="h-11" asChild>
                <Link to="/jobs">بحث</Link>
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <Button
                variant={type === ALL ? "default" : "outline"}
                size="sm"
                onClick={() => setType(ALL)}
              >
                الكل
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
        </div>
      </div>

      {/* Results */}
      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">نتائج البحث</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">
                {filtered.length} وظيفة متاحة
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/pricing">
                أنت ناشر وظائف؟ <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-60 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">لا توجد وظائف مطابقة لبحثك.</p>
              <Button className="mt-4" variant="outline" onClick={() => { setQ(""); setCountry(ALL); setSpecialty(ALL); setType(ALL); }}>
                إعادة ضبط الفلاتر
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
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
      </section>
    </>
  );
}
