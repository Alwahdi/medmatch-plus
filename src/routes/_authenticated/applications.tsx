import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ReviewDialog } from "@/components/review-dialog";
import { Building2, Briefcase, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { applicationLabel, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "طلباتي | SyndeoCare" },
      { name: "description", content: "تابع حالة كل طلب تقدّمت به من التقديم حتى التعيين." },
      { property: "og:title", content: "طلباتي | SyndeoCare" },
      { property: "og:description", content: "متابعة طلبات التوظيف الطبية." },
    ],
  }),
  component: ApplicationsPage,
});

const STAGES = ["submitted", "reviewing", "shortlisted", "interview", "offer", "hired"];

const TXT = {
  ar: {
    title: "طلباتي",
    sub: "كل طلب ومرحلته الحالية لدى المنشأة.",
    loading: "جارٍ التحميل...",
    appliedAt: (t: string) => `قُدّم ${t}`,
    empty: "لا طلبات بعد.",
    browseJobs: "تصفح الوظائف",
    employer: "المنشأة",
  },
  en: {
    title: "My applications",
    sub: "Every application and its current stage with the employer.",
    loading: "Loading...",
    appliedAt: (t: string) => `Applied ${t}`,
    empty: "No applications yet.",
    browseJobs: "Browse jobs",
    employer: "the employer",
  },
} as const;

function ApplicationsPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data, isLoading } = useQuery({
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-muted-foreground">{c.sub}</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{c.loading}</p>
      ) : data?.length ? (
        <ul className="mt-6 space-y-4">
          {data.map((a) => {
            const idx = STAGES.indexOf(a.status);
            const rejected = a.status === "rejected";
            return (
              <li key={a.id} className="card-lift rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Briefcase className="size-5" />
                    </span>
                    <div>
                      <Link to="/jobs/$jobId" params={{ jobId: a.jobs!.id }} className="font-bold hover:text-primary">
                        {a.jobs?.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {a.jobs?.city} · {c.appliedAt(relativeTime(a.created_at, lang))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                {!rejected && (
                  <div className="mt-4 flex gap-1">
                    {STAGES.map((s, i) => (
                      <span
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
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
