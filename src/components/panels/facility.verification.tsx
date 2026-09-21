import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useConfirm } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useDocumentRequirements, type DocRequirement } from "@/lib/document-requirements";
import { VALIDITY_TXT, isExpired, isExpiringSoon, isValidEvidence } from "@/lib/doc-validity";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";
import { ListSkeleton } from "@/components/list-skeleton";
import { ErrorState } from "@/components/error-state";
import { DocumentRequirementCard, type DocRow } from "@/components/document-requirement-card";
import { DocumentUploadDialog } from "@/components/document-upload-dialog";

const TXT = {
  ar: {
    title: "توثيق المنشأة",
    sub: "اختر المستند المطلوب وارفع ملفه. يراجعه فريقنا يدوياً، ولا تظهر الملفات للكوادر — يظهر لهم فقط شارة «منشأة موثّقة».",
    noFacility: "أنشئ ملف المنشأة أولاً قبل رفع مستندات التوثيق.",
    createNow: "إنشاء ملف المنشأة",
    verified: "منشأة موثّقة",
    verifiedSub: "شارة التوثيق تظهر الآن على وظائفك ومناوباتك وملفك العام.",
    unverified: "المنشأة غير موثّقة بعد",
    unverifiedSub: "ارفع المستندات المطلوبة أدناه ليراجعها فريقنا وتحصل على شارة التوثيق.",
    checklist: "المستندات المطلوبة",
    progress: (a: number, b: number) => `${a} من ${b} مستند مطلوب معتمد`,
    remaining: (n: number) => `تبقّى ${n} مستند مطلوب للحصول على شارة التوثيق.`,
    allDone: "اكتملت مستنداتك المطلوبة.",
    loading: "جارٍ التحميل...",
    noFile: "لا يوجد ملف مرفق",
    deleted: "تم حذف المستند",
    saveFailed: "تعذّر الحفظ",
    deleteQ: "حذف هذا المستند؟",
    deleteDesc: "سيُحذف الملف نهائياً وقد يتأثر توثيق منشأتك. يمكنك رفعه مجدداً لاحقاً.",
    yesDelete: "نعم، احذف",
    noReqs: "لم تُحدَّد مستندات مطلوبة بعد. سنبلغك عند تفعيلها.",
  },
  en: {
    title: "Facility verification",
    sub: "Pick a required document and upload its file. Our team reviews it manually; professionals only see the verified badge.",
    noFacility: "Create your facility profile before uploading verification documents.",
    createNow: "Create facility profile",
    verified: "Verified facility",
    verifiedSub: "The verified badge now appears on your jobs, shifts and public profile.",
    unverified: "Facility not verified yet",
    unverifiedSub: "Upload the required documents below so our team can review them.",
    checklist: "Required documents",
    progress: (a: number, b: number) => `${a} of ${b} required documents approved`,
    remaining: (n: number) => `${n} required document(s) left to earn the verified badge.`,
    allDone: "All required documents are complete.",
    loading: "Loading...",
    noFile: "No file attached",
    deleted: "Document deleted",
    saveFailed: "Failed to save",
    deleteQ: "Delete this document?",
    deleteDesc: "The file is permanently removed and your verification may be affected.",
    yesDelete: "Yes, delete",
    noReqs: "No required documents have been defined yet.",
  },
} as const;

export function FacilityVerificationPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const v = VALIDITY_TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();
  const [active, setActive] = useState<DocRequirement | null>(null);

  const { data: reqsData } = useDocumentRequirements("facility");
  const requirements = reqsData ?? [];

  const {
    data: facility,
    isError: facilityErr,
    refetch: facilityRefetch,
    isLoading: facLoading,
  } = useQuery({
    queryKey: ["my-facility-verify", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("id,name_ar,is_verified")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const {
    data: items,
    isError: itemsErr,
    refetch: itemsRefetch,
    isLoading: docsLoading,
  } = useQuery({
    queryKey: ["facility-docs", facility?.id],
    enabled: !!facility?.id,
    queryFn: async (): Promise<DocRow[]> => {
      const { data, error } = await supabase
        .from("facility_documents")
        .select("id,doc_type,title,file_name,issuer,issue_date,expiry_date,file_path,status,review_note,created_at")
        .eq("facility_id", facility!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocRow[];
    },
  });

  const remove = useMutation({
    mutationFn: async (doc: DocRow) => {
      if (doc.file_path) await supabase.storage.from("facility-docs").remove([doc.file_path]);
      const { error } = await supabase.from("facility_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.deleted);
      void queryClient.invalidateQueries({ queryKey: ["facility-docs"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  async function openFile(path: string | null) {
    if (!path) {
      toast.error(c.noFile);
      return;
    }
    const { data, error } = await supabase.storage.from("facility-docs").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      toast.error(c.noFile);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function askDelete(doc: DocRow) {
    const ok = await confirm({
      title: c.deleteQ,
      description: c.deleteDesc,
      confirmLabel: c.yesDelete,
      destructive: true,
    });
    if (ok) remove.mutate(doc);
  }

  if (facilityErr) return <ErrorState onRetry={() => void facilityRefetch()} />;
  if (itemsErr) return <ErrorState onRetry={() => void itemsRefetch()} />;

  if (!facLoading && !facility) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <EmptyState
          icon={ShieldAlert}
          title={c.title}
          description={c.noFacility}
          action={
            <Button asChild>
              <Link to="/facility/profile">{c.createNow}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const list = items ?? [];
  const docsOf = (code: string) => list.filter((d) => d.doc_type === code);
  const requiredReqs = requirements.filter((r) => r.is_required);
  const requiredCodeList = requiredReqs.map((r) => r.code);
  const metRequired = requiredReqs.filter(
    (r) => docsOf(r.code).filter((d) => isValidEvidence(d)).length >= r.min_count,
  ).length;
  const pct = requiredReqs.length ? Math.round((metRequired / requiredReqs.length) * 100) : 0;
  const requiredExpired = list.some(
    (d) => requiredCodeList.includes(d.doc_type) && d.status === "approved" && isExpired(d.expiry_date),
  );
  const requiredExpiringSoon = list.some(
    (d) => requiredCodeList.includes(d.doc_type) && d.status === "approved" && isExpiringSoon(d.expiry_date),
  );
  const isVerified = !!facility?.is_verified;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {confirmDialog}
      <DocumentUploadDialog
        requirement={active}
        ownerId={facility?.id}
        uploadedCount={active ? docsOf(active.code).length : 0}
        onOpenChange={(o) => !o && setActive(null)}
      />

      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>

      <div
        className={`mt-6 flex flex-wrap items-center gap-3 rounded-lg border p-5 ${
          isVerified ? "border-accent/40 bg-accent/5" : "border-border bg-card"
        }`}
      >
        {isVerified ? (
          <BadgeCheck className="size-8 text-accent" />
        ) : (
          <ShieldAlert className="size-8 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold">{isVerified ? c.verified : c.unverified}</p>
          <p className="text-xs text-muted-foreground">{isVerified ? c.verifiedSub : c.unverifiedSub}</p>
        </div>
      </div>

      {requiredExpired ? (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {v.requiredExpired}
        </p>
      ) : requiredExpiringSoon ? (
        <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {v.requiredExpiringSoon}
        </p>
      ) : null}

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{c.checklist}</h2>
          <span className="text-xs text-muted-foreground">{c.progress(metRequired, requiredReqs.length)}</span>
        </div>
        <Progress
          value={pct}
          className="mt-3"
          aria-label={lang === "ar" ? "نسبة اكتمال المستندات" : "Document completion"}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {requiredReqs.length - metRequired > 0 ? c.remaining(requiredReqs.length - metRequired) : c.allDone}
        </p>

        {docsLoading || facLoading ? (
          <div className="mt-4">
            <span className="sr-only">{c.loading}</span>
            <ListSkeleton rows={3} />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {requirements.map((r) => (
              <DocumentRequirementCard
                key={r.id}
                requirement={r}
                docs={docsOf(r.code)}
                anchorPrefix="doc"
                onUpload={() => setActive(r)}
                onView={openFile}
                onDelete={askDelete}
              />
            ))}
          </ul>
        )}

        {!docsLoading && requirements.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {c.noReqs}
          </p>
        ) : null}
      </div>
    </div>
  );
}
