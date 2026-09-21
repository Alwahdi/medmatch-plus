import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
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
import { EmptyState } from "@/components/empty-state";
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
    title: "توثيق المنشأة",
    sub: "ارفع مستندات منشأتك الرسمية. يراجعها فريقنا يدوياً، ولا تظهر للكوادر أبداً — يظهر لهم فقط شارة «منشأة موثّقة».",
    noFacility: "أنشئ ملف المنشأة أولاً قبل رفع مستندات التوثيق.",
    createNow: "إنشاء ملف المنشأة",
    verified: "منشأة موثّقة",
    verifiedSub: "شارة التوثيق تظهر الآن على وظائفك ومناوباتك وملفك العام.",
    unverified: "المنشأة غير موثّقة بعد",
    unverifiedSub: "اعتمد رخصة مزاولة المنشأة والسجل التجاري للحصول على شارة التوثيق تلقائياً.",
    checklist: "المستندات المطلوبة",
    progress: (a: number, b: number) => `${a} من ${b} مستند مطلوب معتمد`,
    required: "مطلوب",
    optional: "اختياري",
    missing: "لم يُرفع",
    addTitle: "رفع مستند",
    docType: "نوع المستند",
    docTypePh: "اختر النوع",
    docTitle: "اسم المستند",
    issuer: "الجهة المُصدِرة",
    issuerPh: "مثال: وزارة الصحة العامة والسكان",
    issueDate: "تاريخ الإصدار",
    expiry: "تاريخ الانتهاء",
    file: "الملف (PDF أو صورة، حتى ١٠ ميجابايت)",
    upload: "رفع المستند",
    uploading: "جارٍ الرفع...",
    myDocs: "مستندات المنشأة",
    loading: "جارٍ التحميل...",
    emptyTitle: "لا مستندات بعد",
    emptyDesc: "ابدأ برفع رخصة مزاولة المنشأة والسجل التجاري.",
    view: "عرض الملف",
    noFile: "لا يوجد ملف مرفق",
    expiresOn: (d: string) => ` · ينتهي ${d}`,
    issuedOn: (d: string) => ` · صدر ${d}`,
    titleReq: "أدخل اسم المستند",
    typeReq: "اختر نوع المستند",
    fileReq: "أرفق ملف المستند",
    fileTooBig: "حجم الملف يتجاوز ١٠ ميجابايت",
    uploadFailed: "تعذّر رفع الملف",
    uploaded: "تم رفع المستند، وسيظهر هنا بحالة «قيد المراجعة» حتى تكتمل مراجعته",
    saveFailed: "تعذّر الحفظ",
    deleted: "تم حذف المستند",
    deleteQ: "حذف هذا المستند؟",
    deleteDesc: "سيُحذف الملف نهائياً وقد يتأثر توثيق منشأتك. يمكنك رفعه مجدداً لاحقاً.",
    yesDelete: "نعم، احذف",
  },
  en: {
    title: "Facility verification",
    sub: "Upload your official facility documents. Our team reviews them manually; professionals never see the files — only the “Verified facility” badge.",
    noFacility: "Create your facility profile before uploading verification documents.",
    createNow: "Create facility profile",
    verified: "Verified facility",
    verifiedSub: "The verified badge now appears on your jobs, shifts and public profile.",
    unverified: "Facility not verified yet",
    unverifiedSub: "Get the operating license and commercial registration approved to earn the badge automatically.",
    checklist: "Required documents",
    progress: (a: number, b: number) => `${a} of ${b} required documents approved`,
    required: "Required",
    optional: "Optional",
    missing: "Not uploaded",
    addTitle: "Upload a document",
    docType: "Document type",
    docTypePh: "Choose type",
    docTitle: "Document name",
    issuer: "Issuing authority",
    issuerPh: "e.g. Ministry of Public Health",
    issueDate: "Issue date",
    expiry: "Expiry date",
    file: "File (PDF or image, up to 10 MB)",
    upload: "Upload document",
    uploading: "Uploading...",
    myDocs: "Facility documents",
    loading: "Loading...",
    emptyTitle: "No documents yet",
    emptyDesc: "Start with the operating license and commercial registration.",
    view: "View file",
    noFile: "No file attached",
    expiresOn: (d: string) => ` · expires ${d}`,
    issuedOn: (d: string) => ` · issued ${d}`,
    titleReq: "Enter the document name",
    typeReq: "Choose the document type",
    fileReq: "Attach the document file",
    fileTooBig: "File size exceeds 10 MB",
    uploadFailed: "Failed to upload the file",
    uploaded: "Document uploaded — it stays “Under review” here until our team completes the review",
    saveFailed: "Failed to save",
    deleted: "Document deleted",
    deleteQ: "Delete this document?",
    deleteDesc: "The file is permanently removed and your verification may be affected.",
    yesDelete: "Yes, delete",
  },
} as const;

type FacilityDoc = {
  id: string;
  doc_type: string;
  title: string;
  file_name: string | null;

  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_path: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
};

export function FacilityVerificationPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();

  const [form, setForm] = useState({
    doc_type: "",
    issuer: "",
    issue_date: "",
    expiry_date: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const { data: reqsData } = useDocumentRequirements("facility");
  const requirements = reqsData ?? [];
  const selectedReq = requirements.find((r) => r.code === form.doc_type) ?? null;
  const typeLabel = (code: string) => {
    const r = requirements.find((x) => x.code === code);
    return r ? reqName(r, lang) : code;
  };

  const { data: facility, isError: facilityErr, refetch: facilityRefetch, isLoading: facLoading } = useQuery({
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

  const { data: docs, isError: docsErr, refetch: docsRefetch, isLoading } = useQuery({
    queryKey: ["facility-docs", facility?.id],
    enabled: !!facility?.id,
    queryFn: async (): Promise<FacilityDoc[]> => {
      const { data, error } = await supabase
        .from("facility_documents")
        .select("id,doc_type,title,file_name,issuer,issue_date,expiry_date,file_path,status,review_note,created_at")
        .eq("facility_id", facility!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FacilityDoc[];
    },
  });

  const schema = z.object({
    doc_type: z.string().min(1, c.typeReq),
  });

  const add = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) userError(parsed.error.issues[0]!.message);
      if (!file) userError(c.fileReq);

      const ready = await prepareUpload(file, "document", lang).catch((e: Error) => userError(e.message));
      const ext = ready.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const filePath = `${facility!.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("facility-docs")
        .upload(filePath, ready, { contentType: ready.type || "application/octet-stream" });
      if (upErr) throw upErr;

      const { error } = await supabase.from("facility_documents").insert({
        facility_id: facility!.id,
        doc_type: form.doc_type,
        title: selectedReq?.name_ar ?? form.doc_type,
        file_name: file.name.slice(0, 200),
        issuer: form.issuer.trim() || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        file_path: filePath,
      });
      if (error) throw error;
    },

    onSuccess: () => {
      toast.success(c.uploaded);
      setForm({ doc_type: "", issuer: "", issue_date: "", expiry_date: "" });
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["facility-docs"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  const remove = useMutation({
    mutationFn: async (doc: FacilityDoc) => {
      if (doc.file_path) {
        await supabase.storage.from("facility-docs").remove([doc.file_path]);
      }
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

  if (facLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <span className="sr-only">{c.loading}</span>
        <ListSkeleton rows={2} />
      </div>
    );
  }

  if (!facility) {
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

  const list = docs ?? [];
  const requiredReqs = requirements.filter((r) => r.is_required);
  const requiredCodeList = requiredReqs.map((r) => r.code);
  const approvedRequired = requiredReqs.filter(
    (r) => list.filter((d) => d.doc_type === r.code && isValidEvidence(d)).length >= r.min_count,
  ).length;
  const pct = requiredReqs.length ? Math.round((approvedRequired / requiredReqs.length) * 100) : 0;
  const requiredExpired = list.some(
    (d) => requiredCodeList.includes(d.doc_type) && d.status === "approved" && isExpired(d.expiry_date),
  );
  const requiredExpiringSoon = list.some(
    (d) => requiredCodeList.includes(d.doc_type) && d.status === "approved" && isExpiringSoon(d.expiry_date),
  );
  const v = VALIDITY_TXT[lang];


  const loadErrors = [
    { err: facilityErr, retry: facilityRefetch },
    { err: docsErr, retry: docsRefetch },
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

      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>

      <div
        className={`mt-6 flex flex-wrap items-center gap-3 rounded-lg border p-5 ${
          facility.is_verified ? "border-accent/40 bg-accent/5" : "border-border bg-card"
        }`}
      >
        {facility.is_verified ? (
          <BadgeCheck className="size-8 text-accent" />
        ) : (
          <ShieldAlert className="size-8 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold">{facility.is_verified ? c.verified : c.unverified}</p>
          <p className="text-xs text-muted-foreground">
            {facility.is_verified ? c.verifiedSub : c.unverifiedSub}
          </p>
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
            {c.progress(approvedRequired, requiredReqs.length)}
          </span>
        </div>
        <Progress value={pct} className="mt-3" />
        <ul className="mt-4 space-y-2">
          {requirements.map((r) => {
            const type = r.code;
            const uploaded = list.filter((d) => d.doc_type === type);
            const doc = uploaded[0];
            const isRequired = r.is_required;
            const note = reqNote(r, lang);
            const needMore = r.min_count > 1;
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
              <li key={type} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-3 sm:gap-3">
                <Icon className={`size-5 shrink-0 ${tone}`} />
                <span className="min-w-0 flex-1 basis-[60%] text-sm">
                  <span className="block truncate">{reqName(r, lang)}</span>
                  {needMore ? (
                    <span className="block text-xs text-muted-foreground">
                      {lang === "ar"
                        ? `مطلوب ${r.min_count} ملفات — رفعت ${uploaded.length}`
                        : `${r.min_count} files required — ${uploaded.length} uploaded`}
                    </span>
                  ) : null}
                  {note ? <span className="block text-xs text-muted-foreground">{note}</span> : null}
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

      <div className="card-lift mt-6 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-bold">{c.addTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{c.docType}</Label>
            <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
              <SelectTrigger aria-label={c.docType}>
                <SelectValue placeholder={c.docTypePh} />
              </SelectTrigger>
              <SelectContent>
                {requirements.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {reqName(r, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReq && reqNote(selectedReq, lang) ? (
              <p className="mt-1 text-xs text-muted-foreground">{reqNote(selectedReq, lang)}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="fd-issuer">
              {c.issuer}
              {selectedReq?.requires_issuer ? <span className="text-destructive"> *</span> : null}
            </Label>


            <Input
              id="fd-issuer"
              maxLength={120}
              placeholder={c.issuerPh}
              value={form.issuer}
              onChange={(e) => setForm({ ...form, issuer: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fd-issue">{c.issueDate}</Label>
              <Input
                id="fd-issue"
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fd-exp">{c.expiry}</Label>
              <Input
                id="fd-exp"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="fd-file">{c.file}</Label>
          <Input
            id="fd-file"
            type="file"
            accept={ACCEPT.document}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr" title={file.name}>
              {file.name}
            </p>
          ) : null}
        </div>
        <Button className="w-full sm:w-auto" onClick={() => add.mutate()} loading={add.isPending}>
          <Upload className="size-4" /> {add.isPending ? c.uploading : c.upload}
        </Button>
      </div>

      <h2 className="mt-10 text-lg font-bold">{c.myDocs}</h2>
      {isLoading ? (
        <div className="mt-4"><ListSkeleton rows={2} /></div>
      ) : list.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={FileText} title={c.emptyTitle} description={c.emptyDesc} />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((doc) => (
            <li key={doc.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-0.5 size-5 text-primary" />
                  <div className="min-w-0">
                    <p className="font-medium">{doc.file_name ?? doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {facilityDocTypeLabel(doc.doc_type, lang)}
                      {doc.issuer ? ` · ${doc.issuer}` : ""}
                      {doc.issue_date ? c.issuedOn(formatDate(doc.issue_date, lang)) : ""}
                      {doc.expiry_date ? c.expiresOn(formatDate(doc.expiry_date, lang)) : ""}
                    </p>
                    {doc.review_note && (
                      <p className="mt-1 text-xs text-destructive">{doc.review_note}</p>
                    )}
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  {isExpired(doc.expiry_date) ? (
                    <Badge variant="destructive">{v.expired}</Badge>
                  ) : isExpiringSoon(doc.expiry_date) ? (
                    <Badge variant="outline">{v.expiringSoon}</Badge>
                  ) : null}
                  <Badge
                    variant={
                      doc.status === "approved"
                        ? "default"
                        : doc.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {credentialLabel(doc.status, lang)}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openFile(doc.file_path)}>
                    <FileText className="size-4" /> {c.view}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={lang === "ar" ? "حذف المستند" : "Delete document"}
                    onClick={async () => {
                      const ok = await confirm({
                        title: c.deleteQ,
                        description: c.deleteDesc,
                        confirmLabel: c.yesDelete,
                        destructive: true,
                      });
                      if (ok) remove.mutate(doc);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
