import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { JobCard, type JobRow } from "@/components/job-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";


const TXT = {
  ar: {
    title: "الوظائف المحفوظة",
    loading: "جارٍ التحميل...",
    empty: "لم تحفظ أي وظيفة بعد",
    browse: "تصفح الوظائف",
    error: "تعذّر تحميل الوظائف المحفوظة.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Saved jobs",
    loading: "Loading...",
    empty: "You haven't saved any job yet",
    browse: "Browse jobs",
    error: "We couldn't load saved jobs.",
    retry: "Try again",
  },
} as const;

export function SavedPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();

  const { data, isLoading, isError, refetch } = useQuery({
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
    <div>
      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{c.loading}</p>
      ) : isError ? (
        <EmptyState className="mt-6" icon={AlertCircle} title={c.error} action={<Button variant="outline" onClick={() => void refetch()}>{c.retry}</Button>} />
      ) : data?.length ? (
        <div className="grid gap-3">
          {data.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          icon={Bookmark}
          title={c.empty}
          action={
            <Button asChild>
              <Link to="/jobs">{c.browse}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
