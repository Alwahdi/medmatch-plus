import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { APPLICATION_LABELS, relativeTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/facility/applicants")({
  head: () => ({
    meta: [
      { title: "المتقدمون | SyndeoCare" },
      { name: "description", content: "راجع المتقدمين لوظائف منشأتك وحرّك كل طلب بين مراحل الفرز." },
      { property: "og:title", content: "المتقدمون | SyndeoCare" },
      { property: "og:description", content: "إدارة المتقدمين لوظائف المنشأة." },
    ],
  }),
  component: Applicants,
});

function Applicants() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["facility-applicants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: facility } = await supabase
        .from("facilities")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!facility) return [];
      const { data: jobs } = await supabase.from("jobs").select("id,title").eq("facility_id", facility.id);
      const ids = (jobs ?? []).map((j) => j.id);
      if (ids.length === 0) return [];
      const { data: apps, error } = await supabase
        .from("applications")
        .select("id,status,created_at,cover_letter,user_id,job_id")
        .in("job_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((apps ?? []).map((a) => a.user_id)));
      const { data: pros } = await supabase
        .from("healthcare_professionals")
        .select("user_id,full_name,headline,years_experience,country,city,is_verified")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

      return (apps ?? []).map((a) => ({
        ...a,
        job: jobs?.find((j) => j.id === a.job_id) ?? null,
        pro: pros?.find((p) => p.user_id === a.user_id) ?? null,
      }));
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: status as "reviewing" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      queryClient.invalidateQueries({ queryKey: ["facility-applicants"] });
    },
    onError: () => toast.error("تعذّر التحديث"),
  });

  const startChat = useMutation({
    mutationFn: async ({ candidateUserId, jobId }: { candidateUserId: string; jobId: string }) => {
      const { data: facility } = await supabase
        .from("facilities")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!facility) throw new Error("no facility");
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("facility_id", facility.id)
        .eq("professional_user_id", candidateUserId)
        .eq("job_id", jobId)
        .maybeSingle();
      if (existing) return;
      const { error } = await supabase.from("conversations").insert({
        facility_id: facility.id,
        professional_user_id: candidateUserId,
        job_id: jobId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح");
      navigate({ to: "/messages" });
    },
    onError: () => toast.error("تعذّر بدء المحادثة"),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">المتقدمون</h1>
        <Link to="/facility" className="text-sm text-primary underline">رجوع للوحة</Link>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">جارٍ التحميل...</p>
      ) : data?.length ? (
        <ul className="mt-6 space-y-4">
          {data.map((a) => (
            <li key={a.id} className="card-lift rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {a.pro?.full_name ?? "كادر صحي"}
                    {a.pro?.is_verified && <Badge className="ms-2" variant="secondary">موثّق</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.pro?.headline ?? "—"} · خبرة {a.pro?.years_experience ?? 0} سنة ·{" "}
                    {[a.pro?.city, a.pro?.country].filter(Boolean).join("، ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    تقدّم لوظيفة: {a.job?.title} · {relativeTime(a.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startChat.mutate({ candidateUserId: a.user_id, jobId: a.job_id })}
                  disabled={startChat.isPending}
                >
                  <MessageSquare className="size-4" /> مراسلة
                </Button>
                <Select value={a.status} onValueChange={(v) => setStatus.mutate({ id: a.id, status: v })}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPLICATION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              </div>
              {a.cover_letter && (
                <p className="mt-4 rounded-xl bg-surface p-4 text-sm leading-relaxed whitespace-pre-line">
                  {a.cover_letter}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">لا يوجد متقدمون بعد.</p>
      )}
    </div>
  );
}
