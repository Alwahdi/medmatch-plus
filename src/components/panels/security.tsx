import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Monitor,
  ShieldCheck,
  Smartphone,
  Trash2,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { EmptyState } from "@/components/empty-state";
import { GoogleIcon } from "@/components/google-icon";
import { useConfirm } from "@/components/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { verifyCurrentPassword } from "@/lib/reauth";
import { useLang } from "@/lib/i18n";
import { friendlyError, userError } from "@/lib/user-errors";
import { formatDateTime, relativeTime } from "@/lib/format";
import { ErrorState } from "@/components/error-state";

const TXT = {
  ar: {
    title: "الأمان وتسجيل الدخول",
    sub: "كلمة المرور، الحسابات المرتبطة، التحقق بخطوتين، والجلسات النشطة",
    pwTitle: "كلمة المرور",
    pwBody: "استخدم كلمة مرور قوية لا تقل عن 8 أحرف ولا تستخدمها في مواقع أخرى.",
    current: "كلمة المرور الحالية",
    newPw: "كلمة المرور الجديدة",
    confirmPw: "تأكيد كلمة المرور الجديدة",
    changePw: "تحديث كلمة المرور",
    pwMismatch: "كلمتا المرور غير متطابقتين",
    pwShort: "كلمة المرور قصيرة جداً (8 أحرف على الأقل)",
    pwDone: "تم تحديث كلمة المرور",
    pwStrength: ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "ممتازة"],
    linkedTitle: "الحسابات المرتبطة",
    linkedBody: "اربط حساب جوجل لتسجيل دخول أسرع بنقرة واحدة.",
    connected: "مرتبط",
    notConnected: "غير مرتبط",
    link: "ربط",
    unlink: "فك الربط",
    unlinkConfirm: "فك ربط هذا الحساب؟",
    unlinkDesc: "لن تتمكن من الدخول بهذه الطريقة بعد الآن. تأكد أن لديك كلمة مرور.",
    unlinkDone: "تم فك الربط",
    linkLast: "لا يمكن فك ربط طريقة الدخول الوحيدة",
    linkUnavailable: "ربط جوجل غير متاح حالياً. سجّل الدخول بجوجل بنفس البريد لاحقاً أو تواصل معنا.",
    linkDone: "تم ربط حساب جوجل",
    mfaTitle: "التحقق بخطوتين (2FA)",
    mfaBody: "أضف طبقة حماية إضافية عبر تطبيق مصادقة مثل Google Authenticator أو Authy.",
    mfaOn: "مفعّل",
    mfaOff: "غير مفعّل",
    mfaEnable: "تفعيل التحقق بخطوتين",
    mfaScan: "امسح الرمز بتطبيق المصادقة ثم أدخل الرمز المكوّن من 6 أرقام.",
    mfaSecret: "أو أدخل هذا المفتاح يدوياً",
    mfaVerify: "تأكيد التفعيل",
    mfaCancel: "إلغاء",
    mfaDone: "تم تفعيل التحقق بخطوتين",
    mfaRemoved: "تم إيقاف التحقق بخطوتين",
    mfaDisable: "إيقاف",
    mfaDisableConfirm: "إيقاف التحقق بخطوتين؟",
    mfaDisableDesc: "سيقل مستوى حماية حسابك.",
    mfaAdded: "أُضيف",
    pwLong: "كلمة المرور يجب ألا تزيد عن ٧٢ حرفاً",
    pwCurrentRequired: "أدخل كلمة المرور الحالية للتأكيد",
    pwCurrentWrong: "كلمة المرور الحالية غير صحيحة",
    pwOthersOut: "تم تحديث كلمة المرور وإنهاء الجلسات الأخرى",
    pwOauthTitle: "لا توجد كلمة مرور لهذا الحساب",
    pwOauthBody: "تدخل حالياً عبر جوجل. لتعيين كلمة مرور، أرسل رابطاً آمناً إلى بريدك.",
    pwOauthSend: "إرسال رابط تعيين كلمة مرور",
    pwOauthSent: "إن كان البريد مسجّلاً لدينا فسيصلك رابط خلال دقائق.",
    lastUsed: "آخر استخدام",
    never: "لم يُستخدم بعد",
    sessTitle: "جلسات الدخول النشطة",
    sessBody: "كل جهاز مسجّل الدخول بحسابك. أنهِ أي جلسة لا تعرفها فوراً.",
    thisDevice: "هذا الجهاز",
    lastActive: "آخر نشاط",
    signOutOthers: "إنهاء الجلسات الأخرى",
    signOutOthersConfirm: "إنهاء كل الجلسات الأخرى؟",
    signOutOthersDesc: "سيتم تسجيل الخروج من كل الأجهزة عدا هذا الجهاز.",
    signOutOthersDone: "تم إنهاء الجلسات الأخرى",
    signOutAll: "تسجيل الخروج من كل الأجهزة",
    signOutAllConfirm: "تسجيل الخروج من كل الأجهزة؟",
    signOutAllDesc: "ستحتاج لتسجيل الدخول من جديد على هذا الجهاز أيضاً.",
    noSessions: "لا توجد جلسات أخرى",
    unknownDevice: "جهاز غير معروف",
    failed: "تعذّر إتمام العملية",
  },
  en: {
    title: "Security & sign-in",
    sub: "Password, linked accounts, two-factor and active sessions",
    pwTitle: "Password",
    pwBody: "Use a strong password of at least 8 characters, unique to this platform.",
    current: "Current password",
    newPw: "New password",
    confirmPw: "Confirm new password",
    changePw: "Update password",
    pwMismatch: "Passwords do not match",
    pwShort: "Password too short (min 8 characters)",
    pwDone: "Password updated",
    pwStrength: ["Very weak", "Weak", "Fair", "Strong", "Excellent"],
    linkedTitle: "Linked accounts",
    linkedBody: "Link Google for one-tap sign-in.",
    connected: "Linked",
    notConnected: "Not linked",
    link: "Link",
    unlink: "Unlink",
    unlinkConfirm: "Unlink this account?",
    unlinkDesc: "You will no longer be able to sign in this way. Make sure you have a password.",
    unlinkDone: "Account unlinked",
    linkLast: "You cannot unlink your only sign-in method",
    linkUnavailable: "Linking Google isn't available right now. Sign in with Google using the same email later, or contact us.",
    linkDone: "Google account linked",
    mfaTitle: "Two-factor authentication (2FA)",
    mfaBody: "Add an extra layer with an authenticator app such as Google Authenticator or Authy.",
    mfaOn: "Enabled",
    mfaOff: "Disabled",
    mfaEnable: "Enable two-factor",
    mfaScan: "Scan the code with your authenticator app, then enter the 6-digit code.",
    mfaSecret: "Or enter this key manually",
    mfaVerify: "Confirm",
    mfaCancel: "Cancel",
    mfaDone: "Two-factor enabled",
    mfaRemoved: "Two-factor disabled",
    mfaDisable: "Disable",
    mfaDisableConfirm: "Disable two-factor?",
    mfaDisableDesc: "Your account will be less protected.",
    mfaAdded: "Added",
    pwLong: "Password must be 72 characters or fewer",
    pwCurrentRequired: "Enter your current password to confirm",
    pwCurrentWrong: "Your current password is incorrect",
    pwOthersOut: "Password updated and other sessions signed out",
    pwOauthTitle: "This account has no password",
    pwOauthBody: "You currently sign in with Google. To set a password, send a secure link to your email.",
    pwOauthSend: "Send a set-password link",
    pwOauthSent: "If that email is registered, a link is on its way.",
    lastUsed: "Last used",
    never: "Never used",
    sessTitle: "Active sessions",
    sessBody: "Every device signed into your account. End any session you don't recognise.",
    thisDevice: "This device",
    lastActive: "Last active",
    signOutOthers: "End other sessions",
    signOutOthersConfirm: "End all other sessions?",
    signOutOthersDesc: "All devices except this one will be signed out.",
    signOutOthersDone: "Other sessions ended",
    signOutAll: "Sign out everywhere",
    signOutAllConfirm: "Sign out on all devices?",
    signOutAllDesc: "You will need to sign in again on this device too.",
    noSessions: "No other sessions",
    unknownDevice: "Unknown device",
    failed: "Something went wrong",
  },
} as const;

type SessionRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  user_agent: string | null;
  ip: string | null;
  not_after: string | null;
};

function describeAgent(ua: string | null, fallback: string) {
  if (!ua) return fallback;
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : fallback;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "";
  return browser ? `${os} · ${browser}` : os;
}

function isMobileAgent(ua: string | null) {
  return !!ua && /iPhone|iPad|Android|Mobile/.test(ua);
}

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

export function SecurityPanel({ embedded = false }: { embedded?: boolean }) {
  const { user, session } = useSession();
  const { lang } = useLang();
  const c = TXT[lang];
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();

  /* ---------------- password ---------------- */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const score = passwordScore(newPw);

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPw.length < 8) userError(c.pwShort);
      if (newPw.length > 72) userError(c.pwLong);
      if (newPw !== confirmPw) userError(c.pwMismatch);
      const email = user?.email;
      const { data: idents, error: identsError } = await supabase.auth.getUserIdentities();
      if (identsError) throw identsError;
      const hasPassword = !!idents?.identities?.some((i) => i.provider === "email");
      if (!hasPassword || !email) userError(c.pwOauthBody);
      if (!currentPw) userError(c.pwCurrentRequired);
      // تحقق عبر عميل مؤقت حتى لا تُستبدل الجلسة الحالية (خصوصاً المؤكَّدة بخطوتين).
      const ok = await verifyCurrentPassword(email as string, currentPw, user?.id ?? "");
      if (!ok) userError(c.pwCurrentWrong);
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
      if (signOutError) throw signOutError;
    },
    onSuccess: () => {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success(c.pwOthersOut);
      void refetchSessions();
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  /* ---------------- identities ---------------- */
  const { data: identities, isError: identitiesErr, refetch: refetchIdentities } = useQuery({
    queryKey: ["identities", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) throw error;
      return data.identities;
    },
  });

  const googleIdentity = identities?.find((i) => i.provider === "google");
  const emailIdentity = identities?.find((i) => i.provider === "email");

  const hasPasswordIdentity = !!emailIdentity;
  const [linking, setLinking] = useState(false);
  const [sendingSetLink, setSendingSetLink] = useState(false);

  async function sendSetPasswordLink() {
    const email = user?.email;
    if (!email) return;
    setSendingSetLink(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } finally {
      setSendingSetLink(false);
      toast.success(c.pwOauthSent);
    }
  }

  async function linkGoogle() {
    setLinking(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/security` },
      });
      if (error) toast.error(friendlyError(error, lang, c.linkUnavailable));
    } finally {
      setLinking(false);
    }
  }

  async function unlinkGoogle() {
    if (!googleIdentity) return;
    if ((identities?.length ?? 0) < 2) {
      toast.error(c.linkLast);
      return;
    }
    const ok = await confirm({
      title: c.unlinkConfirm,
      description: c.unlinkDesc,
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
    if (error) {
      toast.error(friendlyError(error, lang, c.failed));
      return;
    }
    toast.success(c.unlinkDone);
    void refetchIdentities();
  }

  /* ---------------- MFA ---------------- */
  const { data: factors, isError: factorsErr, refetch: refetchFactors } = useQuery({
    queryKey: ["mfa-factors", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data.totp ?? [];
    },
  });
  const activeFactor = factors?.find((f) => f.status === "verified");

  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [otp, setOtp] = useState("");

  const startEnroll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `SyndeoCare ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) =>
      setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }),
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  const verifyEnroll = useMutation({
    mutationFn: async () => {
      if (!enroll) return;
      const challenge = await supabase.auth.mfa.challenge({ factorId: enroll.id });
      if (challenge.error) throw challenge.error;
      const { error } = await supabase.auth.mfa.verify({
        factorId: enroll.id,
        challengeId: challenge.data.id,
        code: otp,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEnroll(null);
      setOtp("");
      toast.success(c.mfaDone);
      void refetchFactors();
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  async function cancelEnroll() {
    if (enroll) await supabase.auth.mfa.unenroll({ factorId: enroll.id });
    setEnroll(null);
    setOtp("");
    void refetchFactors();
  }

  async function disableMfa() {
    if (!activeFactor) return;
    const ok = await confirm({
      title: c.mfaDisableConfirm,
      description: c.mfaDisableDesc,
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: activeFactor.id });
    if (error) {
      toast.error(friendlyError(error, lang, c.failed));
      return;
    }
    toast.success(c.mfaRemoved);
    void refetchFactors();
  }

  /* ---------------- sessions ---------------- */
  const { data: sessions, isError: sessionsErr, refetch: refetchSessions } = useQuery({
    queryKey: ["my-sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_sessions");
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });

  const currentSessionId = useMemo(() => {
    const token = session?.access_token;
    if (!token) return null;
    try {
      const payload = JSON.parse(
        atob((token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/")),
      ) as { session_id?: string };
      return payload.session_id ?? null;
    } catch {
      return null;
    }
  }, [session?.access_token]);

  async function signOutOthers() {
    const ok = await confirm({
      title: c.signOutOthersConfirm,
      description: c.signOutOthersDesc,
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) {
      toast.error(friendlyError(error, lang, c.failed));
      return;
    }
    toast.success(c.signOutOthersDone);
    void refetchSessions();
  }

  async function signOutAll() {
    const ok = await confirm({
      title: c.signOutAllConfirm,
      description: c.signOutAllDesc,
      destructive: true,
    });
    if (!ok) return;
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut({ scope: "global" });
    void navigate({ to: "/auth", replace: true });
  }

  const strengthColors = [
    "bg-destructive",
    "bg-destructive",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];

  const loadErrors = [
    { err: identitiesErr, retry: refetchIdentities },
    { err: factorsErr, retry: refetchFactors },
    { err: sessionsErr, retry: refetchSessions },
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
    <div className={embedded ? "" : "mx-auto max-w-3xl px-4 py-10"}>
      {!embedded && (
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
            <p className="text-sm text-muted-foreground">{c.sub}</p>
          </div>
        </div>
      )}

      <nav className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]" aria-label={c.title}>
        {[
          ["security-password", c.pwTitle],
          ["security-linked", c.linkedTitle],
          ["security-mfa", c.mfaTitle],
          ["security-sessions", c.sessTitle],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-primary/40 hover:text-primary">
            {label}
          </a>
        ))}
      </nav>

      {/* password */}
      <section id="security-password" className="mt-4 scroll-mt-24 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" />
          <h2 className="font-bold">{c.pwTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.pwBody}</p>
        {identities && !hasPasswordIdentity ? (
          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">{c.pwOauthTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.pwOauthBody}</p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={sendSetPasswordLink}
              disabled={sendingSetLink}
            >
              {sendingSetLink ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {c.pwOauthSend}
            </Button>
          </div>
        ) : (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            changePassword.mutate();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="cur">{c.current}</Label>
            <Input
              id="cur"
              type={showPw ? "text" : "password"}
              value={currentPw}
              autoComplete="current-password"
              onChange={(e) => setCurrentPw(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new">{c.newPw}</Label>
            <div className="relative">
              <Input
                id="new"
                type={showPw ? "text" : "password"}
                value={newPw}
                autoComplete="new-password"
                onChange={(e) => setNewPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 end-3 grid place-items-center text-muted-foreground"
                aria-label={c.newPw}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {newPw && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-1.5 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-full flex-1 rounded-full ${
                        i < score ? strengthColors[score] : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{c.pwStrength[score]}</span>
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="conf">{c.confirmPw}</Label>
            <Input
              id="conf"
              type={showPw ? "text" : "password"}
              value={confirmPw}
              autoComplete="new-password"
              onChange={(e) => setConfirmPw(e.target.value)}
            />
          </div>
          <div>
            <Button type="submit" disabled={changePassword.isPending || !newPw}>
              {changePassword.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              {c.changePw}
            </Button>
          </div>
        </form>
        )}
      </section>

      {/* linked accounts */}
      <section id="security-linked" className="mt-4 scroll-mt-24 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <GoogleIcon className="size-5" />
          <h2 className="font-bold">{c.linkedTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.linkedBody}</p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-muted">
              <Mail className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {lang === "ar" ? "البريد وكلمة المرور" : "Email & password"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant={emailIdentity ? "secondary" : "outline"}>
              {emailIdentity ? c.connected : c.notConnected}
            </Badge>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-muted">
              <GoogleIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Google</p>
              <p className="truncate text-xs text-muted-foreground">
                {(googleIdentity?.identity_data?.["email"] as string | undefined) ??
                  (googleIdentity ? c.connected : c.notConnected)}
              </p>
            </div>
            {googleIdentity ? (
              <Button variant="outline" size="sm" onClick={unlinkGoogle}>
                <Unlink className="size-4" /> {c.unlink}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={linkGoogle} disabled={linking}>
                {linking ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                {c.link}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* MFA */}
      <section id="security-mfa" className="mt-4 scroll-mt-24 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Smartphone className="size-5 text-primary" />
          <h2 className="font-bold">{c.mfaTitle}</h2>
          <Badge variant={activeFactor ? "default" : "outline"}>
            {activeFactor ? c.mfaOn : c.mfaOff}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.mfaBody}</p>

        {activeFactor ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {c.mfaAdded} · {formatDateTime(activeFactor.created_at, lang)}
            </span>
            <Button variant="outline" size="sm" onClick={disableMfa}>
              <Trash2 className="size-4" /> {c.mfaDisable}
            </Button>
          </div>
        ) : enroll ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm">{c.mfaScan}</p>
            <div className="flex flex-wrap items-center gap-4">
              <img
                src={enroll.qr}
                alt="TOTP QR"
                className="size-40 rounded-lg border border-border bg-white p-2"
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{c.mfaSecret}</p>
                <code className="block rounded-lg bg-muted px-3 py-2 font-mono text-sm tracking-widest">
                  {enroll.secret}
                </code>
              </div>
            </div>
            <div dir="ltr" className="flex">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => verifyEnroll.mutate()}
                disabled={otp.length !== 6 || verifyEnroll.isPending}
              >
                {verifyEnroll.isPending && <Loader2 className="size-4 animate-spin" />}
                {c.mfaVerify}
              </Button>
              <Button variant="ghost" onClick={cancelEnroll}>
                {c.mfaCancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => startEnroll.mutate()}
            loading={startEnroll.isPending}
          >
            {startEnroll.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {c.mfaEnable}
          </Button>
        )}
      </section>

      {/* sessions */}
      <section id="security-sessions" className="mt-4 scroll-mt-24 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Monitor className="size-5 text-primary" />
          <h2 className="font-bold">{c.sessTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{c.sessBody}</p>

        <div className="mt-4 space-y-2">
          {sessions?.length ? (
            sessions.map((s) => {
              const isCurrent = s.id === currentSessionId;
              const Icon = isMobileAgent(s.user_agent) ? Smartphone : Monitor;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {describeAgent(s.user_agent, c.unknownDevice)}
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[11px]">
                          {c.thisDevice}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.ip ? `${s.ip} · ` : ""}
                      {c.lastActive} {relativeTime(s.updated_at ?? s.created_at, lang)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState icon={Monitor} title={c.noSessions} />
          )}
        </div>

        <Separator className="my-4" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={signOutOthers}>
            <LogOut className="size-4" /> {c.signOutOthers}
          </Button>
          <Button variant="ghost" className="text-destructive" onClick={signOutAll}>
            <LogOut className="size-4" /> {c.signOutAll}
          </Button>
        </div>
      </section>

      {confirmDialog}
    </div>
  );
}
