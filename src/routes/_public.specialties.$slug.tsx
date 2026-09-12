import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { JobCard, type JobRow } from "@/components/job-card";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_public/specialties/$slug")({
  head: () => ({
    meta: [
      { title: "وظائف حسب التخصص | SyndeoCare" },
      {
        name: "description",
        content: "وظائف ومناوبات طبية متاحة الآن في هذا التخصص عبر المنشآت الصحية في الدول العربية.",
      },
      { property: "og:title", content: "وظائف حسب التخصص | SyndeoCare" },
      { property: "og:description", content: "فرص عمل ومناوبات في تخصصك الطبي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpecialtyPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">هذا التخصص غير متاح</h1>
      <Button className="mt-6" asChild>
        <Link to="/specialties">كل التخصصات</Link>
      </Button>
    </div>
  ),
});

function SpecialtyPage() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["specialty", slug],
    queryFn: async () => {
      const { data: specialty } = await supabase
        .from("specialties")
        .select("id,slug,name_ar,name_en,category")
        .eq("slug", slug)
        .maybeSingle();
      if (!specialty) throw notFound();

      const [{ data: jobs }, { data: shifts }] = await Promise.all([
        supabase
          .from("jobs")
          .select(
            "id,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialties(name_ar)",
          )
          .eq("specialty_id", specialty.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("shifts")
          .select(
            "id,title,notes,country,city,starts_at,ends_at,hourly_rate,currency,status,is_urgent,facility_verified,applications_count,specialties(name_ar)",
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

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-12 text-muted-foreground">جارٍ التحميل...</div>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link to="/specialties" className="text-sm text-primary underline">كل التخصصات</Link>
      <h1 className="mt-3 font-display text-4xl font-extrabold">وظائف {data.specialty.name_ar}</h1>
      <p className="mt-3 text-muted-foreground">
        {data.jobs.length} وظيفة و{data.shifts.length} مناوبة متاحة الآن في تخصص {data.specialty.name_ar}.
      </p>

      <h2 className="mt-10 font-display text-xl font-bold">الوظائف</h2>
      {data.jobs.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لا توجد وظائف منشورة حالياً في هذا التخصص.</p>
      )}

      <h2 className="mt-10 font-display text-xl font-bold">المناوبات</h2>
      {data.shifts.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لا توجد مناوبات مفتوحة حالياً في هذا التخصص.</p>
      )}
    </div>
  );
}
