import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { APPLICATION_LABELS, relativeTime } from "@/lib/format";

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

function ApplicationsPage() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["my-apps-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,created_at,cover_letter,jobs(id,title,city,country,facilities(name_ar))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">طلباتي</h1>
      <p className="mt-2 text-muted-foreground">كل طلب ومرحلته الحالية لدى المنشأة.</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">جارٍ التحميل...</p>
      ) : data?.length ? (
        <ul className="mt-6 space-y-4">
          {data.map((a) => {
            const idx = STAGES.indexOf(a.status);
            const rejected = a.status === "rejected";
            return (
              <li key={a.id} className="card-lift rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link to="/jobs/$jobId" params={{ jobId: a.jobs!.id }} className="font-bold hover:text-primary">
                      {a.jobs?.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {a.jobs?.facilities?.name_ar} · {a.jobs?.city} · قُدّم {relativeTime(a.created_at)}
                    </p>
                  </div>
                  <Badge variant={rejected ? "destructive" : "secondary"}>
                    {APPLICATION_LABELS[a.status]}
                  </Badge>
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
        <p className="mt-6 text-sm text-muted-foreground">
          لا طلبات بعد. <Link to="/jobs" className="text-primary underline">تصفح الوظائف</Link>
        </p>
      )}
    </div>
  );
}
