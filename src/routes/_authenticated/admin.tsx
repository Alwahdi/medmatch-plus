import { createFileRoute, Link } from "@tanstack/react-router";
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
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { fieldLabel, changeValueLabel, isOpaqueChangeValue, useSpecialtyList } from "@/components/change-request";
import { credentialLabel, facilityDocTypeLabel, formatDate, formatDateTime, countryLabel, experienceLabel } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { ErrorState } from "@/components/error-state";
import { AdminDeletionQueue } from "@/components/admin-deletion-queue";
import { AdminSafetyReports } from "@/components/admin-safety-reports";
import { AdminReadiness } from "@/components/admin-readiness";
import { VerificationPanel, type DocState, type RequiredDoc } from "@/components/admin-verification";
import { friendlyError } from "@/lib/user-errors";
import { useSessionAal2, useVerifiedTotp } from "@/lib/admin-mfa";
import { VALIDITY_TXT, isExpired, isValidEvidence } from "@/lib/doc-validity";

export const Route = createFileRoute("/_authenticated/admin")({
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
  const [tab, setTab] = useState("docs");

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
          "id,name_ar,country,city,is_verified,rating_avg,rating_count,facility_type,verification_suspended_at,verification_suspension_reason",
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
          className="mt-6 inline-block text-primary underline underline-offset-4"
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
  const PRO_REQUIRED_DOCS = ["ترخيص مزاولة المهنة", "بطاقة الهوية / الجواز"];
  const FACILITY_REQUIRED_DOCS = ["رخصة مزاولة المنشأة", "السجل التجاري"];

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
    return PRO_REQUIRED_DOCS.map((t) => ({
      label: credentialLabel(t, lang),
      state: docState(rows, t),
    }));
  }

  function facilityRequiredDocs(facilityId: string): RequiredDoc[] {
    const rows = (facDocs ?? []).filter((r) => r.facility_id === facilityId);
    return FACILITY_REQUIRED_DOCS.map((t) => ({
      label: facilityDocTypeLabel(t, lang),
      state: docState(rows, t),
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

  const proNameByUser = new Map((pros ?? []).map((p) => [p.user_id, p.full_name]));
  const unknownOwner = lang === "ar" ? "حساب غير معروف" : "Unknown account";
  const credGroups = groupDocs(shownDocs, (cr) => proNameByUser.get(cr.user_id) ?? unknownOwner);
  const facDocGroups = groupDocs(shownFacDocs, (fd) => fd.facilities?.name_ar ?? unknownOwner);

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
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={c.statPending} value={pendingDocs.length} icon={FileText} />
        <StatCard label={c.statFacilities} value={(facilities ?? []).filter((f) => !f.is_verified).length} icon={Building2} />
        <StatCard label={c.statPros} value={(pros ?? []).filter((p) => p.is_verified).length} icon={Stethoscope} />
        <StatCard label={c.statInbox} value={newMsgs.length} icon={Inbox} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="w-max justify-start">
            <TabsTrigger value="docs" className="shrink-0">
              {c.tabDocs}
              {pendingDocs.length > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {pendingDocs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="facdocs" className="shrink-0">
              {c.tabFacDocs}
              {pendingFacDocs.length > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {pendingFacDocs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="facilities" className="shrink-0">{c.tabFacilities}</TabsTrigger>
            <TabsTrigger value="pros" className="shrink-0">{c.tabPros}</TabsTrigger>
            <TabsTrigger value="inbox" className="shrink-0">
              {c.tabInbox}
              {newMsgs.length > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {newMsgs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="changes" className="shrink-0">
              {lang === "ar" ? "طلبات تعديل البيانات" : "Data change requests"}
              {pendingChanges.length > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {pendingChanges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="changelog" className="shrink-0">
              {lang === "ar" ? "سجل التعديلات" : "Change log"}
            </TabsTrigger>
            <TabsTrigger value="deletions" className="shrink-0">
              {lang === "ar" ? "طلبات حذف الحساب" : "Account deletion"}
            </TabsTrigger>
            <TabsTrigger value="safety" className="shrink-0">
              {lang === "ar" ? "بلاغات السلامة" : "Safety reports"}
              {openReports > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {openReports}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="readiness" className="shrink-0">
              {lang === "ar" ? "جاهزية الإطلاق" : "Release readiness"}
            </TabsTrigger>
          </TabsList>
        </div>


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
            <div className="mt-4 space-y-6">
              {credGroups.map((group) => (
                <section key={group.name}>
                  <h2 className="mb-2 text-sm font-bold">
                    {group.name}
                    <span className="ms-2 text-xs font-normal text-muted-foreground">
                      {group.items.length}
                    </span>
                  </h2>
                  <ul className="space-y-3">
              {group.items.map((cr) => (
                <li key={cr.id} className="rounded-lg border border-border bg-card p-4">

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{cr.file_name ?? cr.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {credentialLabel(cr.doc_type, lang)}
                        {cr.issuer ? ` · ${cr.issuer}` : ""}
                        {cr.expiry_date ? ` · ${c.expires(formatDate(cr.expiry_date, lang))}` : ""}
                        {` · ${formatDate(cr.created_at, lang)}`}
                      </p>
                      {cr.review_note && (
                        <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">{cr.review_note}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isExpired(cr.expiry_date) ? (
                        <Badge variant="destructive">{VALIDITY_TXT[lang].expired}</Badge>
                      ) : null}
                      <Badge
                        variant={
                          cr.status === "approved" ? "default" : cr.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {credentialLabel(cr.status, lang)}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => openFile(cr.file_path)}>
                        <FileText className="size-4" /> {c.view}
                      </Button>
                      <Button
                        size="sm"
                        loading={review.isPending}
                        onClick={() => review.mutate({ id: cr.id, status: "approved" })}
                      >
                        <CheckCircle2 className="size-4" /> {c.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectId(rejectId === cr.id ? null : cr.id);
                          setNote(cr.review_note ?? "");
                        }}
                      >
                        <XCircle className="size-4" /> {c.reject}
                      </Button>
                    </div>
                  </div>

                  {rejectId === cr.id && (
                    <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                      <label className="text-xs font-medium" htmlFor={`note-${cr.id}`}>
                        {c.noteLabel}
                      </label>
                      <Textarea aria-label={c.notePlaceholder}
                        id={`note-${cr.id}`}
                        rows={2}
                        className="mt-2 bg-background"
                        value={note}
                        placeholder={c.notePlaceholder}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="mt-2"
                        loading={review.isPending}
                        onClick={() => review.mutate({ id: cr.id, status: "rejected", reviewNote: note.trim() })}
                      >
                        {c.reject}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
                  </ul>
                </section>
              ))}
            </div>

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
            <div className="mt-4 space-y-6">
              {facDocGroups.map((group) => (
                <section key={group.name}>
                  <h2 className="mb-2 text-sm font-bold">
                    {group.name}
                    <span className="ms-2 text-xs font-normal text-muted-foreground">
                      {group.items.length}
                    </span>
                  </h2>
                  <ul className="space-y-3">
              {group.items.map((fd) => (
                <li key={fd.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-bold">{fd.file_name ?? fd.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {facilityDocTypeLabel(fd.doc_type, lang)}

                          {fd.issuer ? ` · ${fd.issuer}` : ""}
                          {fd.expiry_date ? ` · ${c.expires(formatDate(fd.expiry_date, lang))}` : ""}
                          {` · ${formatDate(fd.created_at, lang)}`}
                        </p>
                        {fd.review_note && (
                          <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                            {fd.review_note}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {isExpired(fd.expiry_date) ? (
                          <Badge variant="destructive">{VALIDITY_TXT[lang].expired}</Badge>
                        ) : null}
                        <Badge
                          variant={
                            fd.status === "approved" ? "default" : fd.status === "rejected" ? "destructive" : "secondary"
                          }
                        >
                          {credentialLabel(fd.status, lang)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      <Button size="sm" variant="outline" onClick={() => openFacilityFile(fd.file_path)}>
                        <FileText className="size-4" /> {c.view}
                      </Button>
                      <Button
                        size="sm"
                        loading={reviewFacDoc.isPending}
                        onClick={() => reviewFacDoc.mutate({ id: fd.id, status: "approved" })}
                      >
                        <CheckCircle2 className="size-4" /> {c.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectId(rejectId === fd.id ? null : fd.id);
                          setNote(fd.review_note ?? "");
                        }}
                      >
                        <XCircle className="size-4" /> {c.reject}
                      </Button>
                    </div>
                  </div>
                  {rejectId === fd.id && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium">{c.noteLabel}</p>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={c.notePlaceholder}
                        rows={3}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        loading={reviewFacDoc.isPending}
                        onClick={() => reviewFacDoc.mutate({ id: fd.id, status: "rejected", reviewNote: note })}
                      >
                        {c.reject}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
                  </ul>
                </section>
              ))}
            </div>

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

        <TabsContent value="readiness" className="mt-6">
          <AdminReadiness />
        </TabsContent>
      </Tabs>
    </div>
  );
}
