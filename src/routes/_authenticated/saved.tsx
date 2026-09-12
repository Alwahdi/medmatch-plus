import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { JobCard, type JobRow } from "@/components/job-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

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

const TXT = {
  ar: {
    title: "الوظائف المحفوظة",
    loading: "جارٍ التحميل...",
    empty: "لم تحفظ أي وظيفة بعد",
    browse: "تصفح الوظائف",
  },
  en: {
    title: "Saved jobs",
    loading: "Loading...",
    empty: "You haven't saved any job yet",
    browse: "Browse jobs",
  },
} as const;

function SavedJobs() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("saved_jobs")
        .select(
          "job_id,jobs(id,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialties(name_ar,name_en))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (rows ?? []).map((r) => r.jobs).filter(Boolean) as unknown as JobRow[];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{c.loading}</p>
      ) : data?.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {data.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-bold">{c.empty}</p>
          <Button className="mt-4" asChild>
            <Link to="/jobs">{c.browse}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
