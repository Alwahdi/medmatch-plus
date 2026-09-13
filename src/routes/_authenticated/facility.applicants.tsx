import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewDialog } from "@/components/review-dialog";
import { useConfirm } from "@/components/confirm-dialog";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { applicationLabel, countryLabel, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";

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

const APPLICATION_STATUSES = ["submitted", "reviewing", "shortlisted", "interview", "offer", "hired", "rejected"];

const TXT = {
  ar: {
    title: "المتقدمون",
    back: "رجوع للوحة",
    loading: "جارٍ التحميل...",
    healthcarePro: "كادر صحي",
    verified: "موثّق",
    experience: (n: number) => `خبرة ${n} سنة`,
    appliedFor: (title: string, time: string) => `تقدّم لوظيفة: ${title} · ${time}`,
    message: "مراسلة",
    updated: "تم تحديث حالة الطلب",
    updateFailed: "تعذّر التحديث",
    chatOpened: "تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح",
    chatFailed: "تعذّر بدء المحادثة",
    empty: "لا يوجد متقدمون بعد.",
    viewProfile: "الملف الكامل",
  },
  en: {
    title: "Applicants",
    back: "Back to dashboard",
    loading: "Loading...",
    healthcarePro: "Healthcare professional",
    verified: "Verified",
    experience: (n: number) => `${n} years experience`,
    appliedFor: (title: string, time: string) => `Applied for: ${title} · ${time}`,
    message: "Message",
    updated: "Application status updated",
    updateFailed: "Failed to update",
    chatOpened: "Conversation opened — your facility name is now visible to the candidate",
    chatFailed: "Failed to start conversation",
    empty: "No applicants yet.",
    viewProfile: "Full profile",
  },
} as const;

function Applicants() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { confirm, confirmDialog } = useConfirm();

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
      const facilityId = facility.id;
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
        facilityId,
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
      toast.success(c.updated);
      queryClient.invalidateQueries({ queryKey: ["facility-applicants"] });
    },
    onError: () => toast.error(c.updateFailed),
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
      toast.success(c.chatOpened);
      navigate({ to: "/messages" });
    },
    onError: () => toast.error(c.chatFailed),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {confirmDialog}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{c.title}</h1>
        <Link to="/facility" className="text-sm text-primary underline">{c.back}</Link>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{c.loading}</p>
      ) : data?.length ? (
        <ul className="mt-6 space-y-4">
          {data.map((a) => (
            <li key={a.id} className="card-lift rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold">
                    {a.pro?.full_name ?? c.healthcarePro}
                    {a.pro?.is_verified && <Badge className="ms-2" variant="secondary">{c.verified}</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.pro?.headline ?? "—"} · {c.experience(a.pro?.years_experience ?? 0)} ·{" "}
                    {[a.pro?.city, countryLabel(a.pro?.country, lang)].filter(Boolean).join("، ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.appliedFor(a.job?.title ?? "", relativeTime(a.created_at, lang))}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startChat.mutate({ candidateUserId: a.user_id, jobId: a.job_id })}
                  disabled={startChat.isPending}
                >
                  <MessageSquare className="size-4" /> {c.message}
                </Button>
                {a.status === "hired" && user && (
                  <ReviewDialog
                    direction="facility_to_pro"
                    facilityId={a.facilityId}
                    professionalUserId={a.user_id}
                    authorUserId={user.id}
                    targetName={a.pro?.full_name ?? c.healthcarePro}
                    jobId={a.job_id}
                  />
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link to="/facility/candidates/$userId" params={{ userId: a.user_id }}>
                    <UserRound className="size-4" /> {c.viewProfile}
                  </Link>
                </Button>
                <Select
                  value={a.status}
                  onValueChange={async (v) => {
                    if (v === "rejected") {
                      const ok = await confirm({
                        title: lang === "ar" ? "رفض هذا الطلب؟" : "Reject this application?",
                        description:
                          lang === "ar"
                            ? "سيظهر للمتقدم أن طلبه مرفوض. يمكنك تغيير الحالة لاحقاً."
                            : "The applicant will see the application as rejected. You can change the status later.",
                        confirmLabel: lang === "ar" ? "نعم، ارفض" : "Yes, reject",
                        destructive: true,
                      });
                      if (!ok) return;
                    }
                    setStatus.mutate({ id: a.id, status: v });
                  }}
                >

                  <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((k) => (
                      <SelectItem key={k} value={k}>{applicationLabel(k, lang)}</SelectItem>
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
        <p className="mt-6 text-sm text-muted-foreground">{c.empty}</p>
      )}
    </div>
  );
}
