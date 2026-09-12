import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { JobCard, type JobRow } from "@/components/job-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "الوظائف المحفوظة | SyndeoCare" },
      { name: "description", content: "الوظائف الطبية التي حفظتها للرجوع إليها والتقديم عليها لاحقاً." },
      { property: "og:title", content: "الوظائف المحفوظة | SyndeoCare" },
      { property: "og:description", content: "قائمة الوظائف المحفوظة في حسابك." },
    ],
  }),
  component: SavedJobs,
});

function SavedJobs() {
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("saved_jobs")
        .select(
          "job_id,jobs(id,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialties(name_ar))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (rows ?? []).map((r) => r.jobs).filter(Boolean) as unknown as JobRow[];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">الوظائف المحفوظة</h1>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">جارٍ التحميل...</p>
      ) : data?.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {data.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-bold">لم تحفظ أي وظيفة بعد</p>
          <Button className="mt-4" asChild>
            <Link to="/jobs">تصفح الوظائف</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
