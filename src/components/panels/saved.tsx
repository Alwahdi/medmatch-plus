import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { JobCard, type JobRow } from "@/components/job-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { ListSkeleton } from "@/components/list-skeleton";


const TXT = {
  ar: {
    title: "الوظائف المحفوظة",
    empty: "لم تحفظ أي وظيفة بعد",
    browse: "تصفح الوظائف",
    error: "تعذّر تحميل الوظائف المحفوظة.",
    retry: "إعادة المحاولة",
    closed: "لم تعد هذه الوظيفة متاحة للتقديم",
  },
  en: {
    title: "Saved jobs",
    empty: "You haven't saved any job yet",
    browse: "Browse jobs",
    error: "We couldn't load saved jobs.",
    retry: "Try again",
    closed: "This job is no longer open for applications",
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
      // Phase 92: سجل المحفوظات يمر عبر دالة منقّحة — لا قراءة للجدول الأصلي ولا أي حقل هوية.
      const { data: rows, error } = await supabase.rpc("my_saved_jobs");
      if (error) throw error;
      return (rows ?? []).map((r) => ({
        job: {
          id: r.id,
          slug: r.slug,
          title: r.title,
          country: r.country,
          city: r.city,
          salary_min: r.salary_min,
          salary_max: r.salary_max,
          currency: r.currency,
          employment_type: r.employment_type,
          min_experience: r.min_experience,
          created_at: r.created_at,
          expires_at: r.expires_at,
          is_featured: r.is_featured,
          facility_verified: r.facility_verified,
          applications_count: r.applications_count,
          specialties: r.specialty_name_ar
            ? { name_ar: r.specialty_name_ar, name_en: r.specialty_name_en }
            : null,
        } as JobRow,
        isAvailable: r.is_available,
      }));
    },
  });

  return (
    <div>
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState className="mt-6" icon={AlertCircle} title={c.error} action={<Button variant="outline" onClick={() => void refetch()}>{c.retry}</Button>} />
      ) : data?.length ? (
        <div className="grid gap-3">
          {data.map(({ job, isAvailable }) => (
            <div key={job.id}>
              <JobCard job={job} />
              {!isAvailable ? (
                <p className="mt-1 text-xs text-muted-foreground">{c.closed}</p>
              ) : null}
            </div>
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
