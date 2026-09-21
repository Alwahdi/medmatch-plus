import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useConfirm } from "@/components/confirm-dialog";
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
    title: "ملف الاعتماد",
    sub: "اختر الوثيقة المطلوبة وارفع ملفها. يراجعها فريقنا، والمنشآت ترى حالة التوثيق فقط — لا تُنشر ملفاتك للعامة.",
    checklist: "الوثائق المطلوبة",
    progress: (a: number, b: number) => `${a} من ${b} وثيقة مطلوبة معتمدة`,
    remaining: (n: number) => `تبقّى ${n} وثيقة مطلوبة للحصول على شارة التوثيق.`,
    allDone: "اكتملت وثائقك المطلوبة.",
    verified: "حسابك موثّق",
    verifiedSub: "شارة «موثّق» تظهر للمنشآت على ملفك وطلباتك.",
    unverified: "حسابك غير موثّق بعد",
    unverifiedSub: "ارفع الوثائق المطلوبة أدناه ليراجعها فريقنا وتحصل على شارة التوثيق.",
    deleted: "تم حذف الوثيقة",
    saveFailed: "تعذّر الحفظ",
    noFile: "لا يوجد ملف مرفق",
    deleteQ: "حذف هذه الوثيقة؟",
    deleteDesc: "سيُحذف الملف نهائياً وقد يتأثر توثيق حسابك. يمكنك رفعه مجدداً لاحقاً.",
    yesDelete: "نعم، احذف",
    loading: "جارٍ التحميل...",
  },
  en: {
    title: "Credentials",
    sub: "Pick a required document and upload its file. Our team reviews it; employers only see the verification status.",
    checklist: "Required documents",
    progress: (a: number, b: number) => `${a} of ${b} required documents approved`,
    remaining: (n: number) => `${n} required document(s) left to earn the verified badge.`,
    allDone: "All your required documents are complete.",
    verified: "Your account is verified",
    verifiedSub: "Employers see the verified badge on your profile and applications.",
    unverified: "Your account is not verified yet",
    unverifiedSub: "Upload the required documents below so our team can review them.",
    deleted: "Document deleted",
    saveFailed: "Failed to save",
    noFile: "No file attached",
    deleteQ: "Delete this document?",
    deleteDesc: "The file is permanently removed and your verification may be affected.",
    yesDelete: "Yes, delete",
    loading: "Loading...",
  },
} as const;

export function CredentialsPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const v = VALIDITY_TXT[lang];
  const { confirm, confirmDialog } = useConfirm();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<DocRequirement | null>(null);

  const { data: reqs } = useDocumentRequirements("professional");
  const requirements = reqs ?? [];

  const { data: items, isError: itemsErr, refetch: itemsRefetch, isLoading } = useQuery({
    queryKey: ["my-creds", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DocRow[]> => {
      const { data, error } = await supabase
        .from("credentials")
        .select("id,doc_type,title,file_name,issuer,issue_date,expiry_date,file_path,status,review_note,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocRow[];
    },
  });

  const remove = useMutation({
    mutationFn: async (doc: DocRow) => {
      if (doc.file_path) await supabase.storage.from("credentials").remove([doc.file_path]);
      const { error } = await supabase.from("credentials").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.deleted);
      void queryClient.invalidateQueries({ queryKey: ["my-creds"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  async function openFile(path: string | null) {
    if (!path) {
      toast.error(c.noFile);
      return;
    }
    const { data, error } = await supabase.storage.from("credentials").createSignedUrl(path, 120);
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

  const list = items ?? [];
  const docsOf = (code: string) => list.filter((d) => d.doc_type === code);
  const requiredReqs = requirements.filter((r) => r.is_required);
  const requiredCodeList = requiredReqs.map((r) => r.code);
  const metRequired = requiredReqs.filter(
    (r) => docsOf(r.code).filter((d) => isValidEvidence(d)).length >= r.min_count,
  ).length;
  const isVerified = requiredReqs.length > 0 && metRequired === requiredReqs.length;
  const pct = requiredReqs.length ? Math.round((metRequired / requiredReqs.length) * 100) : 0;
  const requiredExpired = list.some(
    (d) => requiredCodeList.includes(d.doc_type) && d.status === "approved" && isExpired(d.expiry_date),
  );
  const requiredExpiringSoon = list.some(
    (d) => requiredCodeList.includes(d.doc_type) && d.status === "approved" && isExpiringSoon(d.expiry_date),
  );

  if (itemsErr) return <ErrorState onRetry={() => void itemsRefetch()} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {confirmDialog}
      <DocumentUploadDialog
        requirement={active}
        ownerId={user?.id}
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
          aria-label={lang === "ar" ? "نسبة اكتمال الوثائق" : "Credential completion"}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {requiredReqs.length - metRequired > 0 ? c.remaining(requiredReqs.length - metRequired) : c.allDone}
        </p>

        {isLoading ? (
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
                anchorPrefix="cred"
                onUpload={() => setActive(r)}
                onView={openFile}
                onDelete={askDelete}
              />
            ))}
          </ul>
        )}

        {!isLoading && requirements.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {lang === "ar"
              ? "لم تُحدَّد وثائق مطلوبة بعد. سنبلغك عند تفعيلها."
              : "No required documents have been defined yet."}
          </p>
        ) : null}
      </div>

      {/* الوثائق التي لم يعد نوعها مطلوباً تبقى معروضة حتى لا تختفي بلا تفسير */}
      {list.filter((d) => !requirements.some((r) => r.code === d.doc_type)).length > 0 ? (
        <ul className="mt-6 space-y-3">
          {requirements.length >= 0 &&
            list
              .filter((d) => !requirements.some((r) => r.code === d.doc_type))
              .map((d) => (
                <DocumentRequirementCard
                  key={d.id}
                  requirement={
                    {
                      id: d.id,
                      target: "professional",
                      code: d.doc_type,
                      name_ar: d.title,
                      name_en: d.title,
                      is_required: false,
                      min_count: 1,
                      requires_expiry: false,
                      requires_issue_date: false,
                      requires_issuer: false,
                      note_ar: null,
                      note_en: null,
                      sort_order: 999,
                      is_active: false,
                    } satisfies DocRequirement
                  }
                  docs={[d]}
                  anchorPrefix="cred"
                  onUpload={() => undefined}
                  onView={openFile}
                  onDelete={askDelete}
                />
              ))}
        </ul>
      ) : null}
    </div>
  );
}
