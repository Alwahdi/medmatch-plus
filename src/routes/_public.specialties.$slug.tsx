import { createFileRoute, Link, isNotFound, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { JobCard, type JobRow } from "@/components/job-card";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";
import { specialtyName } from "@/lib/format";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    notAvailable: "هذا التخصص غير متاح",
    allSpecialties: "كل التخصصات",
    loading: "جارٍ التحميل...",
    jobsFor: (s: string) => `وظائف ${s}`,
    summary: (jobs: number, shifts: number, s: string) =>
      `${jobs} وظيفة و${shifts} مناوبة متاحة الآن في تخصص ${s}.`,
    jobsHeading: "الوظائف",
    shiftsHeading: "المناوبات",
    noJobs: "لا توجد وظائف منشورة حالياً في هذا التخصص.",
    noShifts: "لا توجد مناوبات مفتوحة حالياً في هذا التخصص.",
  },
  en: {
    notAvailable: "This specialty is not available",
    allSpecialties: "All specialties",
    loading: "Loading...",
    jobsFor: (s: string) => `${s} jobs`,
    summary: (jobs: number, shifts: number, s: string) =>
      `${jobs} jobs and ${shifts} shifts currently available in ${s}.`,
    jobsHeading: "Jobs",
    shiftsHeading: "Shifts",
    noJobs: "No jobs are currently posted in this specialty.",
    noShifts: "No open shifts are currently available in this specialty.",
  },
} as const;

export const Route = createFileRoute("/_public/specialties/$slug")({
  head: () => ({
    meta: [
      { title: "وظائف حسب التخصص | Jobs by specialty | SyndeoCare" },
      {
        name: "description",
        content: "وظائف ومناوبات طبية متاحة الآن في هذا التخصص عبر المنشآت الصحية في الدول العربية.",
      },
      { property: "og:title", content: "وظائف حسب التخصص | Jobs by specialty | SyndeoCare" },
      { property: "og:description", content: "فرص عمل ومناوبات في تخصصك الطبي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpecialtyPage,
  notFoundComponent: () => {
    const { lang } = useLang();
    const c = TXT[lang];
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">{c.notAvailable}</h1>
        <Button className="mt-6" asChild>
          <Link to="/specialties">{c.allSpecialties}</Link>
        </Button>
      </div>
    );
  },
});

function SpecialtyPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { slug } = Route.useParams();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["specialty", slug],
    queryFn: async () => {
      const { data: specialty, error: specialtyError } = await supabase
        .from("specialties")
        .select("id,slug,name_ar,name_en,category")
        .eq("slug", slug)
        .maybeSingle();
      if (specialtyError) throw specialtyError;
      if (!specialty) throw notFound();

      const [{ data: jobs }, { data: shifts }] = await Promise.all([
        supabase
          .from("jobs")
          .select(
            "id,slug,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialties(name_ar,name_en)",
          )
          .eq("specialty_id", specialty.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("shifts")
          .select(
            "id,title,notes,country,city,starts_at,ends_at,hourly_rate,currency,status,is_urgent,facility_verified,applications_count,specialties(name_ar,name_en)",
          )
          .eq("specialty_id", specialty.id)
          .eq("status", "open")
          .order("starts_at", { ascending: true })
          .limit(6),
      ]);

      return {
        specialty,
        jobs: (jobs ?? []) as unknown as JobRow[],
        shifts: (shifts ?? []) as unknown as ShiftRow[],
      };
    },
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <span className="sr-only">{c.loading}</span>
        <ListSkeleton rows={3} />
      </div>
    );
  const missing = isError && isNotFound(error);
  if (missing)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">{c.notAvailable}</h1>
        <Button className="mt-6" asChild>
          <Link to="/specialties">{c.allSpecialties}</Link>
        </Button>
      </div>
    );
  if (isError || !data)
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );

  const specialty = specialtyName(data.specialty, lang);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link to="/specialties" className="text-sm text-primary underline">{c.allSpecialties}</Link>
      <h1 className="mt-3 font-display text-4xl font-extrabold">{c.jobsFor(specialty)}</h1>
      <p className="mt-3 text-muted-foreground">
        {c.summary(data.jobs.length, data.shifts.length, specialty)}
      </p>

      <h2 className="mt-10 font-display text-xl font-bold">{c.jobsHeading}</h2>
      {data.jobs.length ? (
        <div className="mt-4 space-y-3">
          {data.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{c.noJobs}</p>
      )}

      <h2 className="mt-10 font-display text-xl font-bold">{c.shiftsHeading}</h2>
      {data.shifts.length ? (
        <div className="mt-4 space-y-3">
          {data.shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{c.noShifts}</p>
      )}
    </div>
  );
}
