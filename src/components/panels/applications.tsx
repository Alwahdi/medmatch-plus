import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ReviewDialog } from "@/components/review-dialog";
import { CandidateInterviewBlock } from "@/components/interview";
import { AlertCircle, Briefcase, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { APPLICATION_STAGES, applicationLabel, applicationStage, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { ListSkeleton } from "@/components/list-skeleton";


const STAGES = [...APPLICATION_STAGES];

const TXT = {
  ar: {
    title: "طلباتي",
    sub: "كل طلب ومرحلته الحالية لدى المنشأة.",
    appliedAt: (t: string) => `قُدّم ${t}`,
    empty: "لا طلبات بعد.",
    browseJobs: "تصفح الوظائف",
    employer: "المنشأة",
    error: "تعذّر تحميل طلباتك.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "My applications",
    sub: "Every application and its current stage with the employer.",
    appliedAt: (t: string) => `Applied ${t}`,
    empty: "No applications yet.",
    browseJobs: "Browse jobs",
    employer: "the employer",
    error: "We couldn't load your applications.",
    retry: "Try again",
  },
} as const;

export function ApplicationsPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-apps-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,created_at,cover_letter,jobs(id,title,city,country,facility_id)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const facilityIds = Array.from(new Set((data ?? []).map((a) => a.jobs?.facility_id).filter(Boolean) as string[]));
      const { data: facs } = facilityIds.length
        ? await supabase.from("facilities").select("id,name_ar").in("id", facilityIds)
        : { data: [] as { id: string; name_ar: string }[] };
      return (data ?? []).map((a) => ({
        ...a,
        facilityName: facs?.find((f) => f.id === a.jobs?.facility_id)?.name_ar ?? null,
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
        <ul className="space-y-3">
          {data.map((a) => {
            const idx = STAGES.indexOf(applicationStage(a.status) as (typeof STAGES)[number]);
            const rejected = a.status === "rejected";
            return (
              <li key={a.id} className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Briefcase className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <Link to="/jobs/$jobId" params={{ jobId: a.jobs!.id }} className="block truncate font-bold hover:text-primary">
                        {a.jobs?.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {a.jobs?.city} · {c.appliedAt(relativeTime(a.created_at, lang))}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                    {a.status === "hired" && user && a.jobs?.facility_id && (
                      <ReviewDialog
                        direction="pro_to_facility"
                        facilityId={a.jobs.facility_id}
                        professionalUserId={user.id}
                        authorUserId={user.id}
                        targetName={a.facilityName ?? c.employer}
                        jobId={a.jobs.id}
                      />
                    )}
                    <Badge variant={rejected ? "destructive" : "secondary"} className="gap-1">
                      {rejected ? <XCircle className="size-3.5" /> : a.status === "hired" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                      {applicationLabel(a.status, lang)}
                    </Badge>
                  </div>
                </div>
                <CandidateInterviewBlock applicationId={a.id} />
                {!rejected && (
                  <div className="mt-4">
                    <div className="flex gap-1" aria-hidden="true">
                      {STAGES.map((s, i) => (
                        <span
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex gap-1 text-[11px]">
                      {STAGES.map((s, i) => (
                        <span
                          key={s}
                          className={`flex-1 text-center ${i === idx ? "font-bold text-foreground" : "text-muted-foreground"}`}
                        >
                          {applicationLabel(s, lang)}
                        </span>
                      ))}
                    </div>
                    <span className="sr-only">
                      {c.stageOf(applicationLabel(STAGES[Math.max(idx, 0)]!, lang), idx + 1, STAGES.length)}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          className="mt-6"
          icon={FileText}
          title={c.empty}
          action={
            <Button asChild>
              <Link to="/jobs">{c.browseJobs}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
