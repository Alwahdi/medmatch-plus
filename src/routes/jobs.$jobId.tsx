import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, MapPin, Wallet, BriefcaseMedical, ShieldCheck, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { EMPLOYMENT_LABELS, formatSalary, relativeTime } from "@/lib/format";

const coverSchema = z.string().trim().max(2000, "الرسالة طويلة جداً");

export const Route = createFileRoute("/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "تفاصيل الوظيفة | SyndeoCare" },
      {
        name: "description",
        content: "تفاصيل الوظيفة الطبية: المنشأة، الموقع، نطاق الراتب، المتطلبات، والتقديم المباشر.",
      },
      { property: "og:title", content: "تفاصيل الوظيفة | SyndeoCare" },
      { property: "og:description", content: "تعرّف على تفاصيل الوظيفة وقدّم عليها مباشرة." },
    ],
  }),
  component: JobDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">هذه الوظيفة لم تعد متاحة</h1>
      <Button className="mt-6" asChild><Link to="/jobs">تصفح وظائف أخرى</Link></Button>
    </div>
  ),
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [cover, setCover] = useState("");

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*,specialties(name_ar)")
        .eq("id", jobId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["application", jobId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id,status")
        .eq("job_id", jobId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: saved } = useQuery({
    queryKey: ["saved-job", jobId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("job_id", jobId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (saved) {
        const { error } = await supabase.from("saved_jobs").delete().eq("id", saved.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user!.id });
      if (error) throw error;
      return true;
    },
    onSuccess: (added) => {
      toast.success(added ? "تم حفظ الوظيفة" : "تمت إزالة الوظيفة من المحفوظات");
      queryClient.invalidateQueries({ queryKey: ["saved-job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
    onError: () => toast.error("تعذّر تحديث المحفوظات"),
  });

  const apply = useMutation({
    mutationFn: async () => {
      const parsed = coverSchema.safeParse(cover);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase
        .from("applications")
        .insert({ job_id: jobId, user_id: user!.id, cover_letter: parsed.data || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال طلبك بنجاح");
      queryClient.invalidateQueries({ queryKey: ["application", jobId] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذّر إرسال الطلب"),
  });

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10"><Skeleton className="h-96 rounded-2xl" /></div>;
  if (!job) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="card-lift rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold">{job.title}</h1>
          {user && (
            <Button variant="outline" size="sm" onClick={() => toggleSave.mutate()} disabled={toggleSave.isPending}>
              {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {saved ? "محفوظة" : "حفظ الوظيفة"}
            </Button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
          <span className="flex items-center gap-2">
            <Building2 className="size-4" /> ناشر الوظيفة محجوب لحماية خصوصية المنشأة
          </span>
          {job.facility_verified && <Badge variant="secondary">ناشر موثّق</Badge>}
          {!!job.applications_count && (
            <Badge variant="outline">تقدّم {job.applications_count}</Badge>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1"><MapPin className="size-3" /> {job.city}، {job.country}</Badge>
          <Badge variant="outline" className="gap-1"><Wallet className="size-3" /> {formatSalary(Number(job.salary_min), Number(job.salary_max), job.currency)}</Badge>
          <Badge variant="outline" className="gap-1"><BriefcaseMedical className="size-3" /> {EMPLOYMENT_LABELS[job.employment_type]}</Badge>
          {job.required_license && <Badge variant="outline" className="gap-1"><ShieldCheck className="size-3" /> ترخيص {job.required_license}</Badge>}
          <Badge variant="outline" className="gap-1"><Clock className="size-3" /> نُشرت {relativeTime(job.created_at)}</Badge>
        </div>

        <h2 className="mt-8 text-lg font-bold">وصف الوظيفة</h2>
        <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">{job.description}</p>

        <h2 className="mt-6 text-lg font-bold">المتطلبات</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>خبرة لا تقل عن {job.min_experience} سنوات في {job.specialties?.name_ar ?? "التخصص المطلوب"}</li>
          {job.required_license && <li>ترخيص مزاولة مهنة سارٍ من {job.required_license}</li>}
          <li>إجادة العمل ضمن فريق متعدد التخصصات</li>
        </ul>

        <div className="mt-6 rounded-xl bg-surface p-4 text-sm text-muted-foreground">
          هوية المنشأة الناشرة تظهر لك مباشرة بعد قبول طلبك أو بدء التواصل معك — كل ناشر على
          SyndeoCare تُراجَع اعتماداته قبل النشر.
        </div>
      </div>

      <div className="card-lift mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">التقديم على الوظيفة</h2>
        {!user ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              سجّل دخولك كي تتقدم وتتابع حالة طلبك خطوة بخطوة.
            </p>
            <Button className="mt-4" asChild><Link to="/auth">تسجيل الدخول للتقديم</Link></Button>
          </>
        ) : existing ? (
          <p className="mt-2 text-sm text-success">
            تم التقديم على هذه الوظيفة مسبقاً. تابع الحالة من{" "}
            <Link to="/applications" className="underline">صفحة طلباتي</Link>.
          </p>
        ) : (
          <>
            <Textarea
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="اكتب رسالة تعريفية مختصرة (اختياري): خبرتك، سبب اهتمامك، وتاريخ الالتحاق الممكن."
              className="mt-4"
            />
            <Button className="mt-4" onClick={() => apply.mutate()} disabled={apply.isPending}>
              {apply.isPending ? "جارٍ الإرسال..." : "أرسل الطلب"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
