import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Loader2, ShieldAlert, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/error-state";
import { useConfirm } from "@/components/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";
import { formatDate } from "@/lib/format";

const TXT = {
  ar: {
    accountTitle: "حسابك",
    email: "البريد المسجّل",
    accountType: "نوع الحساب",
    typePro: "كادر صحي",
    typeFacility: "منشأة صحية",
    typeAdmin: "إدارة",
    typeNone: "لم يكتمل الإعداد بعد",
    dataTitle: "بياناتك",
    dataBody: "يمكنك مراجعة بياناتك وتعديلها من الصفحات التالية.",
    myProfile: "ملفي الشخصي",
    myCv: "سيرتي الذاتية",
    myCreds: "اعتماداتي",
    facProfile: "ملف المنشأة",
    facVerify: "توثيق المنشأة",
    legalTitle: "السياسات",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    contact: "تواصل معنا",
    delTitle: "حذف الحساب",
    delBody:
      "حذف الحساب يتم عبر طلب يراجعه فريقنا، وليس حذفاً فورياً. بعد إرسال الطلب نتحقق من هويتك ونوقف ظهور ملفك، وقد نحتفظ ببعض السجلات المرتبطة بتعاملات سابقة أو بمتطلبات أمنية لفترة محدودة.",
    reason: "سبب الحذف (اختياري)",
    reasonPh: "ما الذي دفعك لهذا القرار؟",
    submit: "إرسال طلب الحذف",
    confirmTitle: "إرسال طلب حذف الحساب؟",
    confirmBody:
      "سيصل الطلب لفريقنا للمراجعة. يمكنك إلغاؤه ما دام قيد الانتظار.",
    confirmYes: "إرسال الطلب",
    sent: "تم إرسال طلب الحذف.",
    cancelled: "تم إلغاء طلب الحذف.",
    statusTitle: "حالة طلبك",
    pending: "قيد الانتظار",
    processing: "قيد المعالجة",
    completed: "مكتمل",
    processingNote:
      "طلبك قيد المعالجة. حسابك ما زال موجوداً ويمكنك الدخول إليه حتى تُنفَّذ عملية الحذف وإخفاء الهوية، وسنُعلمك عند اكتمالها.",

    rejected: "مرفوض",
    cancelledS: "ملغى",
    requestedOn: (d: string) => `تاريخ الطلب: ${d}`,
    cancelBtn: "إلغاء الطلب",
    cannotCancel: "بدأت معالجة الطلب، لم يعد الإلغاء ممكناً من هنا. تواصل معنا إذا غيّرت رأيك.",
    failed: "تعذّر تنفيذ العملية. حاول مرة أخرى.",
  },
  en: {
    accountTitle: "Your account",
    email: "Registered email",
    accountType: "Account type",
    typePro: "Healthcare professional",
    typeFacility: "Healthcare facility",
    typeAdmin: "Administrator",
    typeNone: "Setup not finished yet",
    dataTitle: "Your data",
    dataBody: "You can review and edit your data on these pages.",
    myProfile: "My profile",
    myCv: "My CV",
    myCreds: "My credentials",
    facProfile: "Facility profile",
    facVerify: "Facility verification",
    legalTitle: "Policies",
    privacy: "Privacy policy",
    terms: "Terms of use",
    contact: "Contact us",
    delTitle: "Delete account",
    delBody:
      "Account deletion is handled as a request reviewed by our team, not an instant erase. Once you submit it we verify your identity and stop showing your profile, and some records tied to past transactions or security requirements may be kept for a limited period.",
    reason: "Reason (optional)",
    reasonPh: "What led to this decision?",
    submit: "Submit deletion request",
    confirmTitle: "Submit an account deletion request?",
    confirmBody: "Our team will review it. You can cancel while it's still pending.",
    confirmYes: "Submit request",
    sent: "Your deletion request was submitted.",
    cancelled: "Your deletion request was cancelled.",
    statusTitle: "Your request",
    pending: "Pending",
    processing: "Processing",
    completed: "Processed",
    rejected: "Rejected",
    cancelledS: "Cancelled",
    requestedOn: (d: string) => `Requested on: ${d}`,
    cancelBtn: "Cancel request",
    cannotCancel: "Processing has started, so it can't be cancelled here. Contact us if you changed your mind.",
    failed: "That didn't work. Please try again.",
  },
} as const;

export function AccountPrivacyPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const qc = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();
  const [reason, setReason] = useState("");

  const isFacility = !!roles?.includes("facility");
  const isAdmin = !!roles?.includes("admin");
  const isPro = !!roles?.includes("professional");

  const accountType = isAdmin
    ? c.typeAdmin
    : isFacility
      ? c.typeFacility
      : isPro
        ? c.typePro
        : c.typeNone;

  const requestsQuery = useQuery({
    queryKey: ["account-deletion-request", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_account_deletion_request");
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const active =
    requestsQuery.data && ["pending", "processing"].includes(requestsQuery.data.status)
      ? requestsQuery.data
      : null;

  const submit = useMutation({
    mutationFn: async () => {
      const trimmed = reason.trim();
      const { error } = await supabase.rpc(
        "request_account_deletion",
        trimmed ? { _reason: trimmed } : {},
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setReason("");
      toast.success(c.sent);
      void qc.invalidateQueries({ queryKey: ["account-deletion-request", user?.id] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  const cancelRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("cancel_account_deletion", { _request_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.cancelled);
      void qc.invalidateQueries({ queryKey: ["account-deletion-request", user?.id] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  const statusLabel = (s: string) =>
    s === "pending"
      ? c.pending
      : s === "processing"
        ? c.processing
        : s === "completed"
          ? c.completed
          : s === "rejected"
            ? c.rejected
            : c.cancelledS;

  async function askAndSubmit() {
    const ok = await confirm({
      title: c.confirmTitle,
      description: c.confirmBody,
      confirmLabel: c.confirmYes,
      destructive: true,
    });
    if (ok) submit.mutate();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <UserCog className="size-5 text-primary" />
          <h2 className="font-bold">{c.accountTitle}</h2>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <dt className="text-muted-foreground">{c.email}</dt>
            <dd className="font-medium break-all">{user?.email}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <dt className="text-muted-foreground">{c.accountType}</dt>
            <dd>
              <Badge variant="secondary">{accountType}</Badge>
            </dd>
          </div>
        </dl>

        <Separator className="my-4" />

        <h3 className="text-sm font-bold">{c.dataTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{c.dataBody}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {isFacility ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/facility/profile">{c.facProfile}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/facility/verification">{c.facVerify}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile">{c.myProfile}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile" search={{ tab: "cv" }}>{c.myCv}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile" search={{ tab: "credentials" }}>{c.myCreds}</Link>
              </Button>
            </>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">{c.legalTitle}</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/privacy">{c.privacy}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/terms">{c.terms}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/contact">{c.contact}</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-destructive/30 bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-destructive" />
          <h2 className="font-bold">{c.delTitle}</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{c.delBody}</p>

        {requestsQuery.isLoading ? (
          <div className="mt-4 h-10 w-40 animate-pulse rounded bg-muted" />
        ) : requestsQuery.isError ? (
          <ErrorState
            error={requestsQuery.error}
            onRetry={() => void requestsQuery.refetch()}
            className="py-6"
          />
        ) : active ? (
          <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">{c.statusTitle}</span>
              <Badge variant={active.status === "pending" ? "secondary" : "default"}>
                {statusLabel(active.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {c.requestedOn(formatDate(active.requested_at, lang))}
            </p>
            {/* Internal review notes stay internal: the safe read model excludes them. */}

            {active.status === "pending" ? (
              <Button
                className="mt-4"
                variant="outline"
                disabled={cancelRequest.isPending}
                onClick={() => cancelRequest.mutate(active.id)}
              >
                {cancelRequest.isPending && <Loader2 className="size-4 animate-spin" />}
                {c.cancelBtn}
              </Button>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{c.cannotCancel}</p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="deletion-reason">{c.reason}</Label>
              <Textarea
                id="deletion-reason"
                className="mt-1"
                rows={3}
                maxLength={1000}
                value={reason}
                placeholder={c.reasonPh}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              disabled={submit.isPending}
              onClick={() => void askAndSubmit()}
            >
              {submit.isPending && <Loader2 className="size-4 animate-spin" />}
              {c.submit}
            </Button>
          </div>
        )}
      </section>

      {confirmDialog}
    </div>
  );
}
