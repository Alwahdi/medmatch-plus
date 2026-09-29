import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  Search,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/list-skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLocations } from "@/components/admin-locations";
import { AdminDistricts } from "@/components/admin-districts";
import { AdminLegalContent } from "@/components/admin-legal";
import { AdminPlatformSettings } from "@/components/admin-platform-settings";
import { AdminDocumentRequirements } from "@/components/admin-requirements";
import { AdminDocumentRenewal } from "@/components/admin-document-renewal";
import { reqName, useAllDocumentRequirements } from "@/lib/document-requirements";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { fieldLabel, changeValueLabel, isOpaqueChangeValue, useSpecialtyList } from "@/components/change-request";
import { credentialLabel, facilityDocTypeLabel, formatDate, formatDateTime, countryLabel, experienceLabel, facilityTypeLabel } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { ErrorState } from "@/components/error-state";
import { AdminDeletionQueue } from "@/components/admin-deletion-queue";
import { AdminSafetyReports } from "@/components/admin-safety-reports";
import { AdminReadiness } from "@/components/admin-readiness";
import { VerificationPanel, type DocState, type RequiredDoc } from "@/components/admin-verification";
import { AdminReviewQueue, type ReviewOwner } from "@/components/admin-review-queue";
import { friendlyError } from "@/lib/user-errors";
import { useSessionAal2, useVerifiedTotp } from "@/lib/admin-mfa";
import { ADMIN_GROUPS } from "@/components/dashboard-shell";
import { VALIDITY_TXT, isExpired, isValidEvidence } from "@/lib/doc-validity";

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | SyndeoCare" },
      { name: "description", content: "مراجعة وثائق التراخيص واعتماد المنشآت الصحية وإدارة رسائل التواصل." },
      { property: "og:title", content: "لوحة الإدارة | SyndeoCare" },
      { property: "og:description", content: "مراجعة التوثيق واعتماد المنشآت." },
    ],
  }),
  component: AdminPage,
});


const TXT = {
  ar: {
    loading: "جارٍ التحميل...",
    adminOnlyTitle: "هذه الصفحة للإدارة فقط",
    mfaGateTitle: "التحقق بخطوتين مطلوب لحسابات الإدارة",
    mfaGateText: "فعّل تطبيق المصادقة من صفحة الأمان ثم عد إلى لوحة الإدارة. لن تعمل أي عملية إدارية قبل ذلك.",
    mfaGateAction: "الذهاب إلى الأمان",
    stepUpTitle: "أدخل رمز التحقق لمتابعة العمل الإداري",
    stepUpText: "جلستك الحالية بكلمة المرور فقط. أدخل الرمز من تطبيق المصادقة لتفعيل أزرار الاعتماد والرفض.",
    stepUpAction: "إدخال رمز التحقق",
    adminOnlyText: "حسابك لا يملك صلاحية مراجعة الوثائق واعتماد المنشآت.",
    backToDashboard: "العودة إلى لوحتك",
    title: "لوحة الإدارة",
    sub: "مراجعة التوثيق، اعتماد المنشآت، ومتابعة رسائل التواصل.",
    tabDocs: "الوثائق",
    tabFacDocs: "مستندات المنشآت",
    tabFacilities: "المنشآت",
    tabPros: "الكوادر",
    tabInbox: "رسائل التواصل",
    statPending: "وثائق بانتظار المراجعة",
    statFacilities: "منشآت غير موثّقة",
    statPros: "كوادر موثّقة",
    statInbox: "رسائل جديدة",
    pendingOnly: "قيد المراجعة فقط",
    all: "الكل",
    expires: (d: string) => `ينتهي ${d}`,
    approve: "اعتماد",
    reject: "رفض",
    view: "عرض الملف",
    noFile: "لا يوجد ملف مرفق",
    noDocs: "لا وثائق للمراجعة.",
    noFacDocs: "لا مستندات منشآت للمراجعة.",
    autoVerifyFac: "تُوثَّق المنشأة تلقائياً عند اعتماد رخصة المنشأة والسجل التجاري.",
    noteLabel: "سبب الرفض (يظهر لصاحب الوثيقة)",
    notePlaceholder: "مثال: صورة الترخيص غير واضحة، أعد رفعها بجودة أعلى.",
    unverify: "إلغاء التوثيق",
    verify: "توثيق",
    search: "بحث بالاسم...",
    docUpdated: "تم تحديث حالة الوثيقة",
    updateFailed: "تعذّر التحديث",
    approveAll: (n: number) => `اعتماد الكل (${n})`,
    approveAllConfirm: (name: string, n: number) => `اعتماد ${n} مستنداً قيد المراجعة لـ«${name}»؟`,
    bulkDone: (n: number) => `تم اعتماد ${n} مستنداً`,
    bulkPartial: (ok: number, fail: number) => `تم اعتماد ${ok}، وتعذّر ${fail}`,
    pendingCount: (n: number) => `${n} قيد المراجعة`,
    fileLabel: "الملف",
    detailLocation: "الموقع",
    detailHeadline: "المسمى",
    detailExperience: "الخبرة",
    detailType: "نوع المنشأة",
    detailRating: "التقييم",
    facilityUpdated: "تم تحديث حالة المنشأة",
    proUpdated: "تم تحديث حالة الكادر",
    autoVerify: "يُوثَّق الكادر تلقائياً عند اعتماد ترخيص مزاولة المهنة وبطاقة الهوية / الجواز معاً.",
    noPros: "لا توجد ملفات كوادر.",
    noMsgs: "لا توجد رسائل.",
    handled: "تمت المعالجة",
    markHandled: "وضع كمعالجة",
    reopen: "إعادة فتح",
    msgUpdated: "تم تحديث حالة الرسالة",
    experience: (n: number) => experienceLabel(n, "ar"),
    fileFailed: "تعذّر فتح الملف",
    rating: (a: number, n: number) => `${a} (${n} تقييم)`,
  },
  en: {
    loading: "Loading...",
    adminOnlyTitle: "This page is for admins only",
    mfaGateTitle: "Two-factor authentication is required for admin accounts",
    mfaGateText: "Set up an authenticator app on the Security page, then come back. Admin actions stay blocked until you do.",
    mfaGateAction: "Go to Security",
    stepUpTitle: "Enter your verification code to continue",
    stepUpText: "This session used your password only. Enter the code from your authenticator app to unlock approve and reject.",
    stepUpAction: "Enter verification code",
    adminOnlyText: "Your account doesn't have permission to review documents and verify facilities.",
    backToDashboard: "Back to your dashboard",
    title: "Admin panel",
    sub: "Review credentials, verify facilities, and follow up on contact messages.",
    tabDocs: "Documents",
    tabFacDocs: "Facility documents",
    tabFacilities: "Facilities",
    tabPros: "Professionals",
    tabInbox: "Contact inbox",
    statPending: "Documents awaiting review",
    statFacilities: "Unverified facilities",
    statPros: "Verified professionals",
    statInbox: "New messages",
    pendingOnly: "Pending only",
    all: "All",
    expires: (d: string) => `Expires ${d}`,
    approve: "Approve",
    reject: "Reject",
    view: "View file",
    noFile: "No file attached",
    noDocs: "No documents to review.",
    noFacDocs: "No facility documents to review.",
    autoVerifyFac: "A facility is verified automatically once its operating license and commercial registration are approved.",
    noteLabel: "Rejection reason (shown to the owner)",
    notePlaceholder: "e.g. The license photo is unclear, please upload a higher quality scan.",
    unverify: "Remove verification",
    verify: "Verify",
    search: "Search by name...",
    docUpdated: "Document status updated",
    updateFailed: "Failed to update",
    approveAll: (n: number) => `Approve all (${n})`,
    approveAllConfirm: (name: string, n: number) => `Approve ${n} pending document(s) for "${name}"?`,
    bulkDone: (n: number) => `${n} document(s) approved`,
    bulkPartial: (ok: number, fail: number) => `${ok} approved, ${fail} failed`,
    pendingCount: (n: number) => `${n} pending`,
    fileLabel: "File",
    detailLocation: "Location",
    detailHeadline: "Headline",
    detailExperience: "Experience",
    detailType: "Facility type",
    detailRating: "Rating",
    facilityUpdated: "Facility status updated",
    proUpdated: "Professional status updated",
    autoVerify: "Professionals are verified automatically once both their practice license and ID / passport are approved.",
    noPros: "No professional profiles.",
    noMsgs: "No messages.",
    handled: "Handled",
    markHandled: "Mark as handled",
    reopen: "Reopen",
    msgUpdated: "Message status updated",
    experience: (n: number) => experienceLabel(n, "en"),
    fileFailed: "Could not open the file",
    rating: (a: number, n: number) => `${a} (${n} reviews)`,
  },
} as const;

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-4 text-primary" /> {label}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function AdminPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data: roles, isLoading: rolesLoading } = useRoles(user);
  const queryClient = useQueryClient();
  const isAdmin = roles?.includes("admin");
  const { data: hasTotp, isLoading: totpLoading } = useVerifiedTotp(!!isAdmin);
  const { data: aal2, isLoading: aalLoading } = useSessionAal2(!!isAdmin);
  // الطابور الحسّاس لا يُحمَّل إطلاقاً لمدير بلا عامل TOTP موثّق وجلسة مؤكَّدة.
  const adminReady = !!isAdmin && hasTotp === true && aal2 === true;

  const [pendingOnly, setPendingOnly] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [facQuery, setFacQuery] = useState("");
  const [proQuery, setProQuery] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [changeRejectId, setChangeRejectId] = useState<string | null>(null);
  const [logQuery, setLogQuery] = useState("");
  const adminNavigate = useNavigate();
  const tab = Route.useSearch().tab ?? "overview";
  const setTab = (value: string) =>
    void adminNavigate({ to: "/admin", search: { tab: value }, replace: true });

  const { data: proRequirements } = useAllDocumentRequirements("professional");
  const { data: facRequirements } = useAllDocumentRequirements("facility");

  const { data: creds, isError: credsErr, refetch: credsRefetch, isLoading: credsLoading } = useQuery({
    queryKey: ["admin-creds"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: facilities, isError: facilitiesErr, refetch: facilitiesRefetch } = useQuery({
    queryKey: ["admin-facilities"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select(
          "id,user_id,name_ar,country,city,is_verified,rating_avg,rating_count,facility_type,verification_suspended_at,verification_suspension_reason",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pros, isError: prosErr, refetch: prosRefetch } = useQuery({
    queryKey: ["admin-pros"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("healthcare_professionals")
        .select(
          "id,user_id,full_name,headline,years_experience,country,city,is_verified,rating_avg,rating_count,verification_suspended_at,verification_suspension_reason",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: facDocs, isError: facDocsErr, refetch: facDocsRefetch, isLoading: facDocsLoading } = useQuery({
    queryKey: ["admin-facility-docs"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facility_documents")
        .select("*, facilities(name_ar)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: inbox, isError: inboxErr, refetch: inboxRefetch } = useQuery({
    queryKey: ["admin-inbox"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: specialtyList } = useSpecialtyList();

  const { data: changeReqs, isError: changeReqsErr, refetch: changeReqsRefetch } = useQuery({
    queryKey: ["admin-change-requests"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_change_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: safetyReports } = useQuery({
    queryKey: ["admin-safety-reports"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_safety_reports");
      if (error) throw error;
      return data ?? [];
    },
  });



  const { data: changeLog, isError: changeLogErr, refetch: changeLogRefetch } = useQuery({
    queryKey: ["admin-change-log"],
    enabled: adminReady,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_change_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const reviewChange = useMutation({
    mutationFn: async ({ id, approve, note }: { id: string; approve: boolean; note?: string }) => {
      const args = note ? { _id: id, _approve: approve, _note: note } : { _id: id, _approve: approve };
      const { error } = await supabase.rpc("review_change_request", args);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.docUpdated);
      setChangeNote("");
      setChangeRejectId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-change-log"] });
    },
    onError: (e: Error) => {
      toast.error(friendlyError(e, lang) || c.updateFailed);
    },
  });


  const review = useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: "approved" | "rejected";
      reviewNote?: string;
    }) => {
      const { error } = await supabase.rpc("admin_review_credential", {
        _id: id,
        _status: status,
        ...(reviewNote ? { _note: reviewNote } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.docUpdated);
      setRejectId(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-creds"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pros"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang) || c.updateFailed),
  });

  const reviewFacDoc = useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: "approved" | "rejected";
      reviewNote?: string;
    }) => {
      const { error } = await supabase.rpc("admin_review_facility_document", {
        _id: id,
        _status: status,
        ...(reviewNote ? { _note: reviewNote } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.docUpdated);
      setRejectId(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-facility-docs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facilities"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang) || c.updateFailed),
  });

  /** اعتماد كل المستندات قيد المراجعة لمالك واحد عبر نفس مسار المراجعة المحمي. */
  const bulkApprove = useMutation({
    mutationFn: async ({ ids, kind }: { ids: string[]; kind: "cred" | "facdoc"; groupKey: string }) => {
      let ok = 0;
      let firstError = "";
      for (const id of ids) {
        const { error } = await supabase.rpc(
          kind === "cred" ? "admin_review_credential" : "admin_review_facility_document",
          { _id: id, _status: "approved" },
        );
        if (error) {
          if (!firstError) firstError = friendlyError(error as unknown as Error, lang) || c.updateFailed;
        } else ok++;
      }
      return { ok, failed: ids.length - ok, firstError };
    },
    onSuccess: ({ ok, failed, firstError }) => {
      if (failed === 0) toast.success(c.bulkDone(ok));
      else toast.error(`${c.bulkPartial(ok, failed)}${firstError ? ` — ${firstError}` : ""}`);
      queryClient.invalidateQueries({ queryKey: ["admin-creds"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pros"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facility-docs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facilities"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang) || c.updateFailed),
  });



  const verifyFacility = useMutation({
    mutationFn: async ({ id, value, reason }: { id: string; value: boolean; reason?: string }) => {
      const { error } = await supabase.rpc("admin_set_facility_verified", {
        _facility_id: id,
        _value: value,
        ...(reason ? { _reason: reason } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.facilityUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-facilities"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang) || c.updateFailed),
  });

  const verifyPro = useMutation({
    mutationFn: async ({ id, value, reason }: { id: string; value: boolean; reason?: string }) => {
      const { error } = await supabase.rpc("admin_set_professional_verified", {
        _professional_id: id,
        _value: value,
        ...(reason ? { _reason: reason } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.proUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-pros"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang) || c.updateFailed),
  });

  const handleMsg = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ is_handled: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.msgUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang) || c.updateFailed),
  });

  async function openFile(path: string | null) {
    if (!path) {
      toast.error(c.noFile);
      return;
    }
    const { data, error } = await supabase.storage.from("credentials").createSignedUrl(path, 120);
    if (error || !data) {
      toast.error(c.fileFailed);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function openFacilityFile(path: string | null) {
    if (!path) {
      toast.error(c.noFile);
      return;
    }
    const { data, error } = await supabase.storage.from("facility-docs").createSignedUrl(path, 120);
    if (error || !data) {
      toast.error(c.fileFailed);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (rolesLoading || (isAdmin && (totpLoading || aalLoading)))
    return (
      <div className="mx-auto max-w-4xl p-6">
        <span className="sr-only">{c.loading}</span>
        <ListSkeleton rows={3} />
      </div>
    );
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">{c.adminOnlyTitle}</h1>
        <p className="mt-2 text-muted-foreground">{c.adminOnlyText}</p>
        <Link to="/dashboard" className="mt-6 inline-block text-primary underline underline-offset-4">
          {c.backToDashboard}
        </Link>
      </div>
    );

  if (isAdmin && hasTotp === false)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShieldCheck className="mx-auto size-8 text-primary" aria-hidden />
        <h1 className="mt-3 font-display text-2xl font-extrabold">{c.mfaGateTitle}</h1>
        <p className="mt-2 text-muted-foreground">{c.mfaGateText}</p>
        <Link to="/security" className="mt-6 inline-block text-primary underline underline-offset-4">
          {c.mfaGateAction}
        </Link>
      </div>
    );

  if (isAdmin && hasTotp === true && aal2 === false)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShieldCheck className="mx-auto size-8 text-primary" aria-hidden />
        <h1 className="mt-3 font-display text-2xl font-extrabold">{c.stepUpTitle}</h1>
        <p className="mt-2 text-muted-foreground">{c.stepUpText}</p>
        <a
          href="/mfa-challenge?next=/admin"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {c.stepUpAction}
        </a>
      </div>
    );

  const pendingDocs = (creds ?? []).filter((d) => d.status === "pending");
  const shownDocs = pendingOnly ? pendingDocs : creds ?? [];
  const shownFacilities = (facilities ?? []).filter((f) =>
    facQuery.trim() ? f.name_ar.includes(facQuery.trim()) : true,
  );
  const shownPros = (pros ?? []).filter((p) => (proQuery.trim() ? p.full_name.includes(proQuery.trim()) : true));

  // Evidence checklists mirror the DB rule: verification is granted only when
  // every required document is approved (see sync_pro/facility_verification).
  const proReqRows = (proRequirements ?? []).filter((r) => r.is_active && r.is_required);
  const facReqRows = (facRequirements ?? []).filter((r) => r.is_active && r.is_required);

  function docState(
    rows: { doc_type: string; status: string; expiry_date: string | null }[],
    docType: string,
  ): DocState {
    const matches = rows.filter((r) => r.doc_type === docType);
    if (matches.length === 0) return "missing";
    // Evidence validity and the review decision are separate: an approved doc
    // whose expiry passed stops counting, but stays "approved" in review.
    if (matches.some((r) => isValidEvidence(r))) return "approved";
    if (matches.some((r) => r.status === "approved")) return "expired";
    if (matches.some((r) => r.status === "pending")) return "pending";
    return "rejected";
  }

  function proRequiredDocs(userId: string): RequiredDoc[] {
    const rows = (creds ?? []).filter((r) => r.user_id === userId);
    return proReqRows.map((r) => ({
      label: reqName(r, lang),
      state: docState(rows, r.code),
    }));
  }

  function facilityRequiredDocs(facilityId: string): RequiredDoc[] {
    const rows = (facDocs ?? []).filter((r) => r.facility_id === facilityId);
    return facReqRows.map((r) => ({
      label: reqName(r, lang),
      state: docState(rows, r.code),
    }));
  }
  const newMsgs = (inbox ?? []).filter((m) => !m.is_handled);
  const pendingFacDocs = (facDocs ?? []).filter((d) => d.status === "pending");
  const shownFacDocs = pendingOnly ? pendingFacDocs : facDocs ?? [];

  /** يُعرض لكل منشأة/مختص عنوان واحد تحته مستنداته، بدل قائمة مسطّحة. */
  function groupDocs<T>(rows: T[], ownerName: (row: T) => string) {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const key = ownerName(row);
      const list = map.get(key);
      if (list) list.push(row);
      else map.set(key, [row]);
    }
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  }

  const unknownOwner = lang === "ar" ? "حساب غير معروف" : "Unknown account";
  const proByUser = new Map((pros ?? []).map((p) => [p.user_id, p]));
  const facById = new Map((facilities ?? []).map((f) => [f.id, f]));
  const joinMeta = (parts: (string | null | undefined)[]) => parts.filter((p) => !!p && p !== "").join(" · ");

  /** صف واحد لكل كادر رفع وثائق، ومستنداته تحته في ملفه. */
  const credOwners: ReviewOwner[] = groupDocs(shownDocs, (cr) => cr.user_id).map(({ name: userId, items }) => {
    const p = proByUser.get(userId);
    const place = p ? joinMeta([p.city, countryLabel(p.country, lang)]).replace(" · ", "، ") : "";
    return {
      key: userId,
      userId,
      name: p?.full_name ?? unknownOwner,
      meta: joinMeta([p?.headline, place]),
      verified: !!p?.is_verified,
      details: p
        ? [
            ...(p.headline ? [{ label: c.detailHeadline, value: p.headline }] : []),
            ...(place ? [{ label: c.detailLocation, value: place }] : []),
            { label: c.detailExperience, value: experienceLabel(p.years_experience, lang) },
            ...(p.rating_count > 0
              ? [{ label: c.detailRating, value: c.rating(Number(p.rating_avg), p.rating_count) }]
              : []),
          ]
        : [],
      docs: items,
      required: proRequiredDocs(userId),
    };
  });

  /** صف واحد لكل منشأة رفعت مستندات. */
  const facDocOwners: ReviewOwner[] = groupDocs(shownFacDocs, (fd) => fd.facility_id).map(
    ({ name: facilityId, items }) => {
      const f = facById.get(facilityId);
      const place = f ? `${f.city}، ${countryLabel(f.country, lang)}` : "";
      return {
        key: facilityId,
        userId: f?.user_id ?? null,
        name: f?.name_ar ?? items[0]?.facilities?.name_ar ?? unknownOwner,
        meta: joinMeta([f ? facilityTypeLabel(f.facility_type, lang) : null, place]),
        verified: !!f?.is_verified,
        details: f
          ? [
              { label: c.detailType, value: facilityTypeLabel(f.facility_type, lang) },
              { label: c.detailLocation, value: place },
              ...(f.rating_count > 0
                ? [{ label: c.detailRating, value: c.rating(Number(f.rating_avg), f.rating_count) }]
                : []),
            ]
          : [],
        docs: items,
        required: facilityRequiredDocs(facilityId),
      };
    },
  );

  const pendingChanges = (changeReqs ?? []).filter((r) => r.status === "pending");
  const openReports = (safetyReports ?? []).filter((r) => r.status === "open").length;
  const shownChanges = pendingOnly ? pendingChanges : changeReqs ?? [];
  const loadErrors = [
    { err: credsErr, retry: credsRefetch },
    { err: facilitiesErr, retry: facilitiesRefetch },
    { err: prosErr, retry: prosRefetch },
    { err: facDocsErr, retry: facDocsRefetch },
    { err: inboxErr, retry: inboxRefetch },
    { err: changeReqsErr, retry: changeReqsRefetch },
    { err: changeLogErr, retry: changeLogRefetch },
  ].filter((q) => q.err);
  if (loadErrors.length > 0)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState
          onRetry={() => {
            for (const q of loadErrors) void q.retry();
          }}
        />
      </div>
    );

  const shownLog = (changeLog ?? []).filter((l) =>
    logQuery.trim() ? `${l.field} ${l.old_value ?? ""} ${l.new_value ?? ""}`.includes(logQuery.trim()) : true,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminHeader tab={tab} lang={lang} />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="sr-only">
          {ADMIN_GROUPS.flatMap((g) => g.items).map((it) => (
            <TabsTrigger key={it.tab} value={it.tab}>{lang === "ar" ? it.ar : it.en}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <AdminOverview
            lang={lang}
            queues={[
              { tab: "docs", n: pendingDocs.length, icon: FileText, ar: "وثائق كوادر بانتظار القرار", en: "Professional documents awaiting decision" },
              { tab: "facdocs", n: pendingFacDocs.length, icon: Building2, ar: "مستندات منشآت بانتظار القرار", en: "Facility documents awaiting decision" },
              { tab: "changes", n: pendingChanges.length, icon: FileText, ar: "طلبات تعديل بيانات", en: "Data change requests" },
              { tab: "safety", n: openReports, icon: ShieldCheck, ar: "بلاغات سلامة مفتوحة", en: "Open safety reports" },
              { tab: "inbox", n: newMsgs.length, icon: Inbox, ar: "رسائل تواصل غير معالجة", en: "Unhandled contact messages" },
            ]}
            oldest={[
              ...pendingDocs.map((d) => ({ id: d.id, tab: "docs", at: d.created_at, title: credentialLabel(d.doc_type, lang) })),
              ...pendingFacDocs.map((d) => ({ id: d.id, tab: "facdocs", at: d.created_at, title: facilityDocTypeLabel(d.doc_type, lang) })),
              ...pendingChanges.map((r) => ({ id: r.id, tab: "changes", at: r.created_at, title: fieldLabel(r.field, lang) })),
            ]
              .sort((a, b) => a.at.localeCompare(b.at))
              .slice(0, 5)
              .map((o) => ({ ...o, when: formatDate(o.at, lang) }))}
            people={{
              pros: (pros ?? []).length,
              prosVerified: (pros ?? []).filter((p) => p.is_verified).length,
              facilities: (facilities ?? []).length,
              facilitiesUnverified: (facilities ?? []).filter((f) => !f.is_verified).length,
            }}
          />
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={pendingOnly ? "default" : "outline"} onClick={() => setPendingOnly(true)}>
              {c.pendingOnly}
            </Button>
            <Button size="sm" variant={pendingOnly ? "outline" : "default"} onClick={() => setPendingOnly(false)}>
              {c.all}
            </Button>
            <span className="text-xs text-muted-foreground">{c.autoVerify}</span>
          </div>

          {credsLoading ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {c.loading}
            </p>
          ) : shownDocs.length === 0 ? (
            <p className="mt-6 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {c.noDocs}
            </p>
          ) : (
            <AdminReviewQueue
              lang={lang}
              owners={credOwners}
              docLabel={(t) => credentialLabel(t, lang)}
              statusLabel={(s) => credentialLabel(s, lang)}
              onOpenFile={openFile}
              onApprove={(id) => review.mutate({ id, status: "approved" })}
              onReject={(id, reviewNote) => review.mutate({ id, status: "rejected", reviewNote })}
              onApproveAll={(owner, ids) => bulkApprove.mutate({ ids, kind: "cred", groupKey: owner.key })}
              reviewPending={review.isPending}
              bulkPendingKey={bulkApprove.isPending ? bulkApprove.variables?.groupKey ?? null : null}
              autoVerifyNote={c.autoVerify}
            />
          )}
        </TabsContent>

        <TabsContent value="facdocs" className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={pendingOnly ? "default" : "outline"} onClick={() => setPendingOnly(true)}>
              {c.pendingOnly}
            </Button>
            <Button size="sm" variant={pendingOnly ? "outline" : "default"} onClick={() => setPendingOnly(false)}>
              {c.all}
            </Button>
            <span className="text-xs text-muted-foreground">{c.autoVerifyFac}</span>
          </div>

          {facDocsLoading ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {c.loading}
            </p>
          ) : shownFacDocs.length === 0 ? (
            <p className="mt-6 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {c.noFacDocs}
            </p>
          ) : (
            <AdminReviewQueue
              lang={lang}
              owners={facDocOwners}
              docLabel={(t) => facilityDocTypeLabel(t, lang)}
              statusLabel={(s) => credentialLabel(s, lang)}
              onOpenFile={openFacilityFile}
              onApprove={(id) => reviewFacDoc.mutate({ id, status: "approved" })}
              onReject={(id, reviewNote) => reviewFacDoc.mutate({ id, status: "rejected", reviewNote })}
              onApproveAll={(owner, ids) => bulkApprove.mutate({ ids, kind: "facdoc", groupKey: owner.key })}
              reviewPending={reviewFacDoc.isPending}
              bulkPendingKey={bulkApprove.isPending ? bulkApprove.variables?.groupKey ?? null : null}
              autoVerifyNote={c.autoVerifyFac}
            />
          )}
        </TabsContent>

        <TabsContent value="facilities" className="mt-6">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              className="ps-9"
              value={facQuery}
              onChange={(e) => setFacQuery(e.target.value)}
              placeholder={c.search}
            />
          </div>
          <ul className="mt-4 space-y-3">
            {shownFacilities.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="flex items-center gap-2 font-bold">
                    {f.name_ar}
                    {f.is_verified && <ShieldCheck className="size-4 text-accent" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f.city}، {countryLabel(f.country, lang)}
                    {f.rating_count > 0 ? ` · ${c.rating(Number(f.rating_avg), f.rating_count)}` : ""}
                  </p>
                </div>
                <VerificationPanel
                  lang={lang}
                  verified={f.is_verified}
                  suspended={!!f.verification_suspended_at}
                  suspensionReason={f.verification_suspension_reason}
                  docs={facilityRequiredDocs(f.id)}
                  pending={verifyFacility.isPending}
                  onReviewDocs={() => setTab("facdocs")}
                  onRestore={() => verifyFacility.mutate({ id: f.id, value: true })}
                  onRevoke={(reason) => verifyFacility.mutate({ id: f.id, value: false, reason })}
                />
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="pros" className="mt-6">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              className="ps-9"
              value={proQuery}
              onChange={(e) => setProQuery(e.target.value)}
              placeholder={c.search}
            />
          </div>
          {shownPros.length === 0 ? (
            <p className="mt-6 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {c.noPros}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {shownPros.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="flex items-center gap-2 font-bold">
                      {p.full_name}
                      {p.is_verified && <ShieldCheck className="size-4 text-accent" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.headline ? `${p.headline} · ` : ""}
                      {c.experience(p.years_experience)}
                      {p.city ? ` · ${p.city}` : ""}
                      {p.rating_count > 0 ? ` · ${c.rating(Number(p.rating_avg), p.rating_count)}` : ""}
                    </p>
                  </div>
                  <VerificationPanel
                    lang={lang}
                    verified={p.is_verified}
                    suspended={!!p.verification_suspended_at}
                    suspensionReason={p.verification_suspension_reason}
                    docs={proRequiredDocs(p.user_id)}
                    pending={verifyPro.isPending}
                    onReviewDocs={() => setTab("docs")}
                    onRestore={() => verifyPro.mutate({ id: p.id, value: true })}
                    onRevoke={(reason) => verifyPro.mutate({ id: p.id, value: false, reason })}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="inbox" className="mt-6">
          {(inbox ?? []).length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {c.noMsgs}
            </p>
          ) : (
            <ul className="space-y-3">
              {(inbox ?? []).map((m) => (
                <li key={m.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">
                        {m.subject || m.name}
                        {m.is_handled && (
                          <Badge variant="secondary" className="ms-2">
                            {c.handled}
                          </Badge>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {m.name} · {m.email} · {formatDateTime(m.created_at, lang)}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${m.email}`}>{m.email}</a>
                      </Button>
                      <Button
                        size="sm"
                        variant={m.is_handled ? "outline" : "default"}
                        onClick={() => handleMsg.mutate({ id: m.id, value: !m.is_handled })}
                      >
                        {m.is_handled ? c.reopen : c.markHandled}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="changes" className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={pendingOnly ? "default" : "outline"} onClick={() => setPendingOnly(true)}>
              {c.pendingOnly}
            </Button>
            <Button size="sm" variant={pendingOnly ? "outline" : "default"} onClick={() => setPendingOnly(false)}>
              {c.all}
            </Button>
          </div>
          {shownChanges.length === 0 ? (
            <p className="mt-4 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "لا توجد طلبات تعديل." : "No change requests."}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {shownChanges.map((r) => (
                <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">
                        {fieldLabel(r.field, lang)}
                        <Badge variant="secondary" className="ms-2">
                          {r.target === "facility"
                            ? lang === "ar" ? "منشأة" : "Facility"
                            : lang === "ar" ? "مختص" : "Professional"}
                        </Badge>
                        {r.status !== "pending" && (
                          <Badge variant={r.status === "approved" ? "default" : "destructive"} className="ms-2">
                            {r.status === "approved"
                              ? lang === "ar" ? "مقبول" : "Approved"
                              : lang === "ar" ? "مرفوض" : "Rejected"}
                          </Badge>
                        )}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">
                          {changeValueLabel(r.field, r.old_value, lang, specialtyList)}
                        </span>{" "}
                        → <b>{changeValueLabel(r.field, r.new_value, lang, specialtyList)}</b>
                      </p>
                      {isOpaqueChangeValue(r.field) && (
                        <p className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground" dir="ltr">
                          {r.old_value || "—"} → {r.new_value}
                        </p>
                      )}
                      {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.created_at, lang)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.attachment_path && (
                        <Button size="sm" variant="outline" onClick={() => openFile(r.attachment_path)}>
                          <FileText className="size-4" />
                          {lang === "ar" ? "المرفق" : "Attachment"}
                        </Button>
                      )}
                      {r.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            loading={reviewChange.isPending}
                            onClick={() => reviewChange.mutate({ id: r.id, approve: true })}
                          >
                            {reviewChange.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                            {lang === "ar" ? "قبول" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setChangeRejectId(changeRejectId === r.id ? null : r.id)}
                          >
                            <XCircle className="size-4" />
                            {lang === "ar" ? "رفض" : "Reject"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {changeRejectId === r.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        rows={2}
                        value={changeNote}
                        maxLength={300}
                        onChange={(e) => setChangeNote(e.target.value)}
                        placeholder={lang === "ar" ? "سبب الرفض (يظهر لصاحب الطلب)" : "Rejection reason (shown to the requester)"}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        loading={reviewChange.isPending}
                        onClick={() => reviewChange.mutate({ id: r.id, approve: false, note: changeNote })}
                      >
                        {lang === "ar" ? "تأكيد الرفض" : "Confirm rejection"}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="changelog" className="mt-6">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              className="ps-9"
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              placeholder={c.search}
            />
          </div>
          {shownLog.length === 0 ? (
            <p className="mt-4 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "لا توجد تعديلات مسجّلة." : "No recorded changes."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {shownLog.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <span>
                    <b>{fieldLabel(l.field, lang)}</b>{" "}
                    <span className="text-muted-foreground">{l.old_value || "—"}</span> → {l.new_value || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(l.created_at, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="deletions" className="mt-6">
          <AdminDeletionQueue />
        </TabsContent>

        <TabsContent value="safety" className="mt-6">
          <AdminSafetyReports />
        </TabsContent>

        <TabsContent value="requirements" className="mt-6">
          <AdminDocumentRequirements />
          <div className="mt-6"><AdminDocumentRenewal /></div>
        </TabsContent>


        <TabsContent value="locations" className="mt-6">
          <AdminLocations />
          <div className="mt-6"><AdminDistricts /></div>
        </TabsContent>

        <TabsContent value="legal" className="mt-6">
          <AdminLegalContent />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <AdminPlatformSettings />
        </TabsContent>

        <TabsContent value="readiness" className="mt-6">
          <AdminReadiness />
        </TabsContent>
      </Tabs>
    </div>
  );
}


function AdminHeader({ tab, lang }: { tab: string; lang: "ar" | "en" }) {
  const group = ADMIN_GROUPS.find((g) => g.items.some((i) => i.tab === tab)) ?? ADMIN_GROUPS[0]!;
  const item = group.items.find((i) => i.tab === tab) ?? group.items[0]!;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{lang === "ar" ? group.ar : group.en}</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{lang === "ar" ? item.ar : item.en}</h1>
      {group.items.length > 1 && (
        <nav
          aria-label={lang === "ar" ? group.ar : group.en}
          className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {group.items.map((it) => (
            <Link
              key={it.tab}
              to="/admin"
              search={{ tab: it.tab }}
              aria-current={it.tab === tab ? "page" : undefined}
              className={
                "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors " +
                (it.tab === tab ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")
              }
            >
              {lang === "ar" ? it.ar : it.en}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

type Queue = { tab: string; n: number; icon: typeof FileText; ar: string; en: string };
type Oldest = { id: string; tab: string; title: string; when: string };

function AdminOverview({
  lang,
  queues,
  oldest,
  people,
}: {
  lang: "ar" | "en";
  queues: Queue[];
  oldest: Oldest[];
  people: { pros: number; prosVerified: number; facilities: number; facilitiesUnverified: number };
}) {
  const ar = lang === "ar";
  const active = queues.filter((q) => q.n > 0);
  const total = active.reduce((a, q) => a + q.n, 0);
  return (
    <div className="space-y-8">
      <section aria-labelledby="needs">
        <h2 id="needs" className="text-sm font-semibold text-muted-foreground">
          {total > 0 ? (ar ? `${total} عنصرًا ينتظر قرارك` : `${total} items need your decision`) : ar ? "لا شيء ينتظر قرارك الآن" : "Nothing needs your decision right now"}
        </h2>
        {total === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card p-5">
            <CheckCircle2 className="size-6 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {ar ? "كل الطوابير فارغة. ستظهر هنا الوثائق والطلبات والبلاغات الجديدة فور وصولها." : "All queues are clear. New documents, requests and reports will appear here."}
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.tab}
                  to="/admin"
                  search={{ tab: q.tab }}
                  className="group flex min-h-20 items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-2xl font-extrabold leading-none">{q.n}</span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">{ar ? q.ar : q.en}</span>
                  </span>
                  <span className="text-sm font-semibold text-primary">{ar ? "راجع" : "Review"}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {oldest.length > 0 && (
        <section aria-labelledby="oldest">
          <h2 id="oldest" className="text-sm font-semibold text-muted-foreground">{ar ? "الأقدم أولًا" : "Oldest first"}</h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {oldest.map((o) => (
              <li key={`${o.tab}-${o.id}`}>
                <Link to="/admin" search={{ tab: o.tab }} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-secondary">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{o.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="people" className="grid gap-3 sm:grid-cols-2">
        <h2 id="people" className="sr-only">{ar ? "الأشخاص" : "People"}</h2>
        <Link to="/admin" search={{ tab: "pros" }} className="rounded-lg border border-border bg-card p-4 hover:border-primary">
          <span className="flex items-center gap-2 text-sm text-muted-foreground"><Stethoscope className="size-4 text-primary" aria-hidden />{ar ? "الكوادر" : "Professionals"}</span>
          <span className="mt-2 block font-display text-2xl font-extrabold">{people.pros}</span>
          <span className="text-xs text-muted-foreground">{ar ? `${people.prosVerified} موثّق` : `${people.prosVerified} verified`}</span>
        </Link>
        <Link to="/admin" search={{ tab: "facilities" }} className="rounded-lg border border-border bg-card p-4 hover:border-primary">
          <span className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="size-4 text-primary" aria-hidden />{ar ? "المنشآت" : "Facilities"}</span>
          <span className="mt-2 block font-display text-2xl font-extrabold">{people.facilities}</span>
          <span className="text-xs text-muted-foreground">{ar ? `${people.facilitiesUnverified} غير موثّقة` : `${people.facilitiesUnverified} unverified`}</span>
        </Link>
      </section>
    </div>
  );
}
