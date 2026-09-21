
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, CheckCircle2, Clock, FileCheck2, FileText, ShieldAlert, ShieldCheck, Trash2, Upload, XCircle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/components/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";

import { useSession } from "@/lib/auth";
import { credentialLabel, formatDate } from "@/lib/format";
import { reqName, reqNote, useDocumentRequirements } from "@/lib/document-requirements";
import { VALIDITY_TXT, isExpired, isExpiringSoon, isValidEvidence } from "@/lib/doc-validity";

import { ACCEPT, prepareUpload } from "@/lib/storage";
import { useLang } from "@/lib/i18n";
import { friendlyError, userError } from "@/lib/user-errors";
import { ListSkeleton } from "@/components/list-skeleton";
import { ErrorState } from "@/components/error-state";


const TXT = {
  ar: {
    title: "ملف الاعتماد",
    sub: "وثائقك تُراجع من فريقنا، والمنشآت ترى حالة التوثيق فقط — لا تُنشر ملفاتك للعامة.",
    addTitle: "إضافة وثيقة",
    docType: "نوع الوثيقة",
    docTypePh: "اختر النوع",
    fileReq: "اختر ملف الوثيقة أولاً",
    issuer: "الجهة المُصدِرة",
    issuerPh: "مثال: الهيئة السعودية للتخصصات الصحية",
    expiry: "تاريخ الانتهاء",
    file: "الملف (PDF أو صورة، حتى ١٠ ميجابايت)",
    upload: "رفع الوثيقة",
    uploading: "جارٍ الرفع...",
    myDocs: "وثائقي",
    loading: "جارٍ التحميل...",
    empty: "لم ترفع أي وثيقة بعد.",
    expiresOn: (d: string) => ` · ينتهي ${d}`,
    titleReq: "أدخل اسم الوثيقة",
    typeReq: "اختر نوع الوثيقة",
    fileTooBig: "حجم الملف يتجاوز ١٠ ميجابايت",
    uploadFailed: "تعذّر رفع الملف",
    uploaded: "تم رفع الوثيقة، وستظهر بحالة «قيد المراجعة» حتى تكتمل مراجعتها",
    saveFailed: "تعذّر الحفظ",
    deleted: "تم حذف الوثيقة",
    checklist: "الوثائق المطلوبة",
    progress: (a: number, b: number) => `${a} من ${b} وثيقة مطلوبة معتمدة`,
    required: "مطلوبة",
    optional: "اختيارية",
    missing: "لم تُرفع",
    verified: "حسابك موثّق",
    verifiedSub: "شارة «موثّق» تظهر للمنشآت على ملفك وطلباتك.",
    unverified: "حسابك غير موثّق بعد",
    unverifiedSub: "اعتمد ترخيص مزاولة المهنة والهوية للحصول على شارة التوثيق.",
    view: "عرض الملف",
    noFile: "لا يوجد ملف مرفق",
  },
  en: {
    title: "Credentials",
    sub: "Your documents are reviewed by our team, and employers only see the verification status — your files are never published publicly.",
    addTitle: "Add a document",
    docType: "Document type",
    docTypePh: "Choose type",
    fileReq: "Choose the document file first",
    issuer: "Issuing authority",
    issuerPh: "e.g. Saudi Commission for Health Specialties",
    expiry: "Expiry date",
    file: "File (PDF or image, up to 10 MB)",
    upload: "Upload document",
    uploading: "Uploading...",
    myDocs: "My documents",
    loading: "Loading...",
    empty: "You haven't uploaded any document yet.",
    expiresOn: (d: string) => ` · expires ${d}`,
    titleReq: "Enter the document name",
    typeReq: "Choose the document type",
    fileTooBig: "File size exceeds 10 MB",
    uploadFailed: "Failed to upload the file",
    uploaded: "Document uploaded — it stays “Under review” until our team completes the review",
    saveFailed: "Failed to save",
    deleted: "Document deleted",
    checklist: "Required documents",
    progress: (a: number, b: number) => `${a} of ${b} required documents approved`,
    required: "Required",
    optional: "Optional",
    missing: "Not uploaded",
    verified: "Your account is verified",
    verifiedSub: "Employers see the verified badge on your profile and applications.",
    unverified: "Your account is not verified yet",
    unverifiedSub: "Get your practice license and ID approved to earn the verified badge.",
    view: "View file",
    noFile: "No file attached",
  },
} as const;

export function CredentialsPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { confirm, confirmDialog } = useConfirm();

  const { user } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ doc_type: "", issuer: "", expiry_date: "" });
  const [file, setFile] = useState<File | null>(null);

  const schema = z.object({
    doc_type: z.string().min(1, c.typeReq),
    issuer: z.string().trim().max(120).optional(),
  });

  const { data: items, isError: itemsErr, refetch: itemsRefetch, isLoading } = useQuery({
    queryKey: ["my-creds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) userError(parsed.error.issues[0]!.message);
      if (!file) userError(c.fileReq);

      const ready = await prepareUpload(file, "document", lang).catch((e: Error) => userError(e.message));
      const ext = ready.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("credentials")
        .upload(filePath, ready, { contentType: ready.type || "application/octet-stream" });
      if (upErr) throw upErr;

      const { error } = await supabase.from("credentials").insert({
        user_id: user!.id,
        title: docTypeLabel(form.doc_type, "ar"),
        file_name: file.name.slice(0, 200),
        doc_type: form.doc_type,
        issuer: form.issuer.trim() || null,
        expiry_date: form.expiry_date || null,
        file_path: filePath,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.uploaded);
      setForm({ doc_type: "", issuer: "", expiry_date: "" });
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-creds"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });


  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.deleted);
      queryClient.invalidateQueries({ queryKey: ["my-creds"] });
    },
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

  const list = items ?? [];
  const approvedRequired = PRO_REQUIRED_DOCS.filter((t) =>
    list.some((d) => d.doc_type === t && isValidEvidence(d)),
  ).length;
  const isVerified = approvedRequired === PRO_REQUIRED_DOCS.length;
  const pct = Math.round((approvedRequired / PRO_REQUIRED_DOCS.length) * 100);
  const requiredExpired = list.some(
    (d) => PRO_REQUIRED_DOCS.includes(d.doc_type) && d.status === "approved" && isExpired(d.expiry_date),
  );
  const requiredExpiringSoon = list.some(
    (d) => PRO_REQUIRED_DOCS.includes(d.doc_type) && d.status === "approved" && isExpiringSoon(d.expiry_date),
  );
  const v = VALIDITY_TXT[lang];


  const loadErrors = [
    { err: itemsErr, retry: itemsRefetch },
  ].filter((q) => q.err);
  if (loadErrors.length > 0)
    return (
      <ErrorState
        onRetry={() => {
          for (const q of loadErrors) void q.retry();
        }}
      />
    );
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {confirmDialog}

      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {c.sub}
      </p>

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


      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{c.checklist}</h2>
          <span className="text-xs text-muted-foreground">
            {c.progress(approvedRequired, PRO_REQUIRED_DOCS.length)}
          </span>
        </div>
        <Progress value={pct} className="mt-3" aria-label={lang === "ar" ? "نسبة اكتمال المستندات" : "Credential completion"} />
        <ul className="mt-4 space-y-2">
          {DOC_TYPES.map((type) => {
            const doc = list.find((d) => d.doc_type === type);
            const isRequired = PRO_REQUIRED_DOCS.includes(type);
            const docExpired = !!doc && doc.status === "approved" && isExpired(doc.expiry_date);
            const Icon =
              docExpired
                ? ShieldAlert
                : doc?.status === "approved"
                  ? CheckCircle2
                  : doc?.status === "rejected"
                    ? XCircle
                    : doc
                      ? Clock
                      : ShieldCheck;
            const tone =
              docExpired || doc?.status === "rejected"
                ? "text-destructive"
                : doc?.status === "approved"
                  ? "text-accent"
                  : "text-muted-foreground";
            return (
              <li key={type} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <Icon className={`size-5 ${tone}`} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {docTypeLabel(type, lang)}
                  {doc?.expiry_date ? (
                    <span className="block text-xs text-muted-foreground">
                      {c.expiry}: {formatDate(doc.expiry_date, lang)}
                    </span>
                  ) : null}
                </span>
                <Badge variant={isRequired ? "secondary" : "outline"} className="shrink-0">
                  {isRequired ? c.required : c.optional}
                </Badge>
                <span className={`shrink-0 text-xs ${docExpired ? "text-destructive" : "text-muted-foreground"}`}>
                  {docExpired ? v.expired : doc ? credentialLabel(doc.status, lang) : c.missing}
                </span>
              </li>
            );

          })}
        </ul>
      </div>

      <div className="card-lift mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-bold">{c.addTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{c.docType}</Label>
            <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
              <SelectTrigger aria-label={c.docType}><SelectValue placeholder={c.docTypePh} /></SelectTrigger>
              <SelectContent>
                {docTypes(lang).map((d, i) => <SelectItem key={d} value={docTypes("ar")[i]!}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="issuer">{c.issuer}</Label>
            <Input id="issuer" maxLength={120} placeholder={c.issuerPh}
              value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="exp">{c.expiry}</Label>
            <Input id="exp" type="date" value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="file">{c.file}</Label>
          <Input id="file" type="file" accept={ACCEPT.document}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file ? <p className="mt-1 truncate text-xs text-muted-foreground">{file.name}</p> : null}
        </div>

        <Button onClick={() => add.mutate()} loading={add.isPending}>
          <Upload className="size-4" /> {add.isPending ? c.uploading : c.upload}
        </Button>
      </div>

      <h2 className="mt-10 text-lg font-bold">{c.myDocs}</h2>
      {isLoading ? (
        <div className="mt-4"><ListSkeleton rows={2} /></div>
      ) : items?.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((cred) => (
            <li key={cred.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <FileCheck2 className="size-5 text-primary" />
                <div>
                  <p className="font-medium">{cred.file_name ?? cred.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {docTypeLabel(cred.doc_type, lang)}
                    {cred.expiry_date ? c.expiresOn(formatDate(cred.expiry_date, lang)) : ""}
                  </p>
                  {cred.review_note && <p className="mt-1 text-xs text-destructive">{cred.review_note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isExpired(cred.expiry_date) ? (
                  <Badge variant="destructive">{v.expired}</Badge>
                ) : isExpiringSoon(cred.expiry_date) ? (
                  <Badge variant="outline">{v.expiringSoon}</Badge>
                ) : null}
                <Badge variant={cred.status === "approved" ? "default" : "secondary"}>
                  {credentialLabel(cred.status, lang)}
                </Badge>

                <Button size="sm" variant="outline" onClick={() => openFile(cred.file_path)}>
                  <FileText className="size-4" /> {c.view}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={lang === "ar" ? "حذف الوثيقة" : "Delete document"}
                  onClick={async () => {
                    const ok = await confirm({
                      title: lang === "ar" ? "حذف هذه الوثيقة؟" : "Delete this document?",
                      description:
                        lang === "ar"
                          ? "سيُحذف الملف نهائياً وقد يتأثر توثيق حسابك. يمكنك رفعه مجدداً لاحقاً."
                          : "The file is permanently removed and your verification may be affected. You can upload it again later.",
                      confirmLabel: lang === "ar" ? "نعم، احذف" : "Yes, delete",
                      destructive: true,
                    });
                    if (ok) remove.mutate(cred.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>

              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-4"
          icon={FileCheck2}
          title={c.empty}
          description={
            lang === "ar"
              ? "ارفع ترخيص المزاولة والشهادة والهوية لتظهر عليك شارة التوثيق أمام المنشآت."
              : "Upload your practice licence, degree and ID so facilities see your verified badge."
          }
        />
      )}
    </div>
  );
}
