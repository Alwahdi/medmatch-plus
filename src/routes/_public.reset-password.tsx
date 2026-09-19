import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_public/reset-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة | Set a new password | SyndeoCare" },
      {
        name: "description",
        content: "اختر كلمة مرور جديدة لحسابك في SyndeoCare بعد فتح رابط الاستعادة المرسل إلى بريدك.",
      },
      { property: "og:title", content: "تعيين كلمة مرور جديدة | Set a new password | SyndeoCare" },
      {
        property: "og:description",
        content: "صفحة آمنة لتعيين كلمة مرور جديدة عبر رابط الاستعادة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const T = {
  title: { ar: "تعيين كلمة مرور جديدة", en: "Set a new password" },
  subtitle: {
    ar: "اختر كلمة مرور جديدة لحسابك، ثم سجّل الدخول بها.",
    en: "Choose a new password for your account, then sign in with it.",
  },
  checking: { ar: "جارٍ التحقق من رابط الاستعادة...", en: "Checking your recovery link..." },
  newPass: { ar: "كلمة المرور الجديدة", en: "New password" },
  confirmPass: { ar: "تأكيد كلمة المرور", en: "Confirm password" },
  passPh: { ar: "٨ أحرف على الأقل", en: "At least 8 characters" },
  show: { ar: "إظهار كلمة المرور", en: "Show password" },
  hide: { ar: "إخفاء كلمة المرور", en: "Hide password" },
  tooShort: { ar: "كلمة المرور يجب ألا تقل عن ٨ أحرف.", en: "Password must be at least 8 characters." },
  tooLong: { ar: "كلمة المرور يجب ألا تزيد عن ٧٢ حرفاً.", en: "Password must be 72 characters or fewer." },
  mismatch: { ar: "كلمتا المرور غير متطابقتين.", en: "The two passwords do not match." },
  save: { ar: "حفظ كلمة المرور", en: "Save password" },
  saving: { ar: "جارٍ الحفظ...", en: "Saving..." },
  failed: {
    ar: "تعذّر تغيير كلمة المرور. جرّب مرة أخرى أو اطلب رابطاً جديداً.",
    en: "We couldn't change your password. Try again or request a new link.",
  },
  doneTitle: { ar: "تم تحديث كلمة المرور", en: "Password updated" },
  doneBody: {
    ar: "أغلقنا الجلسة الحالية لأمانك. سجّل الدخول الآن بكلمة المرور الجديدة.",
    en: "We signed you out for your safety. Sign in now with your new password.",
  },
  toSignIn: { ar: "الذهاب لتسجيل الدخول", en: "Go to sign in" },
  invalidTitle: { ar: "رابط الاستعادة غير صالح أو منتهي", en: "This recovery link is invalid or expired" },
  invalidBody: {
    ar: "روابط استعادة كلمة المرور صالحة لفترة قصيرة ولمرة واحدة. اطلب رابطاً جديداً من صفحة تسجيل الدخول.",
    en: "Password recovery links are short-lived and single-use. Request a new one from the sign-in page.",
  },
  requestNew: { ar: "طلب رابط جديد", en: "Request a new link" },
  backToAuth: { ar: "العودة لتسجيل الدخول", en: "Back to sign in" },
} as const;

type Phase = "checking" | "ready" | "invalid" | "done";

const DONE_KEY = "syndeocare.password-reset.done";

/** يقرأ معاملات الرابط من الاستعلام والهاش معاً (Supabase يستخدم الاثنين حسب التدفق). */
function readLinkParams() {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const get = (key: string) => query.get(key) ?? hash.get(key);
  return {
    code: get("code"),
    tokenHash: get("token_hash"),
    type: get("type"),
    error: get("error") ?? get("error_code") ?? get("error_description"),
  };
}

function ResetPasswordPage() {
  const { lang } = useLang();
  const t = (k: keyof typeof T) => T[k][lang === "en" ? "en" : "ar"];
  // نحفظ نجاح العملية خارج حالة المكوّن لأن تسجيل الخروج بعد التغيير يعيد بناء الصفحة.
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return "checking";
    const params = readLinkParams();
    // رابط استعادة جديد يلغي أي نجاح سابق محفوظ.
    if (params && (params.code || params.tokenHash || params.error)) {
      window.sessionStorage.removeItem(DONE_KEY);
      return "checking";
    }
    return window.sessionStorage.getItem(DONE_KEY) === "1" ? "done" : "checking";
  });

  useEffect(() => {
    let cancelled = false;
    if (phase === "done") return;
    const params = readLinkParams();
    if (!params) return;

    // رابط الاستعادة نفسه أبلغ عن خطأ (منتهي/مستخدم مسبقاً).
    if (params.error) {
      setPhase("invalid");
      return;
    }

    // لا توجد أي إشارة استعادة في الرابط: لا نسمح بتغيير كلمة المرور من هنا
    // حتى لو كان المستخدم مسجّل الدخول بالفعل.
    const looksLikeRecovery =
      Boolean(params.code) || (Boolean(params.tokenHash) && params.type === "recovery");
    if (!looksLikeRecovery) {
      setPhase("invalid");
      return;
    }

    // مسار token_hash: نتحقق يدوياً. مسار code: عميل Supabase يبدّله تلقائياً.
    const start = async () => {
      if (params.tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: params.tokenHash,
        });
        if (cancelled) return;
        setPhase(error ? "invalid" : "ready");
        return;
      }
      // ننتظر انتهاء تبديل الرمز إلى جلسة استعادة.
      for (let i = 0; i < 20 && !cancelled; i += 1) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setPhase("ready");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (!cancelled) setPhase("invalid");
    };
    void start();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-background px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6 sm:p-8">
        {phase === "done" ? (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h1 className="mt-4 font-display text-xl font-extrabold">{t("doneTitle")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("doneBody")}</p>
            <Button
              asChild
              className="mt-6 h-11 w-full rounded-lg"
              onClick={() => window.sessionStorage.removeItem(DONE_KEY)}
            >
              <Link to="/auth">{t("toSignIn")}</Link>
            </Button>
          </div>
        ) : phase === "invalid" ? (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </div>
            <h1 className="mt-4 font-display text-xl font-extrabold">{t("invalidTitle")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("invalidBody")}</p>
            <div className="mt-6 grid gap-2">
              <Button asChild className="h-11 w-full rounded-lg">
                <Link to="/auth">{t("requestNew")}</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 w-full rounded-lg">
                <Link to="/">{t("backToAuth")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <KeyRound className="size-5" />
              </div>
              <h1 className="mt-4 font-display text-xl font-extrabold">{t("title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            {phase === "checking" ? (
              <p className="mt-8 text-center text-sm text-muted-foreground">{t("checking")}</p>
            ) : (
              <NewPasswordForm
                t={t}
                onDone={async () => {
                  // نُنهي جلسة الاستعادة بعد نجاح التغيير حتى لا تبقى مفتوحة من الرابط،
                  // ونمسح معاملات الرابط من العنوان دون إعادة تحميل الصفحة.
                  window.sessionStorage.setItem(DONE_KEY, "1");
                  setPhase("done");
                  window.history.replaceState(null, "", "/reset-password");
                  await supabase.auth.signOut();
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NewPasswordForm({
  t,
  onDone,
}: {
  t: (k: keyof typeof T) => string;
  onDone: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setIssue(t("tooShort"));
      return;
    }
    if (password.length > 72) {
      setIssue(t("tooLong"));
      return;
    }
    if (password !== confirm) {
      setIssue(t("mismatch"));
      return;
    }
    setIssue(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setIssue(t("failed"));
      return;
    }
    toast.success(t("doneTitle"));
    await onDone();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <div>
        <Label htmlFor="rp-pass">{t("newPass")}</Label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="rp-pass"
            type={show ? "text" : "password"}
            dir="ltr"
            autoComplete="new-password"
            placeholder={t("passPh")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={72}
            className="h-11 rounded-lg px-9 text-start"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShow((v) => !v)}
            className="absolute top-1/2 end-0 size-11 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? t("hide") : t("show")}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>
      <div>
        <Label htmlFor="rp-confirm">{t("confirmPass")}</Label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="rp-confirm"
            type={show ? "text" : "password"}
            dir="ltr"
            autoComplete="new-password"
            placeholder={t("passPh")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            maxLength={72}
            className="h-11 rounded-lg ps-9 text-start"
          />
        </div>
      </div>
      {issue ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {issue}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-lg" disabled={busy}>
        {busy ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
