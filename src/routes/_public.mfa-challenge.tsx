import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

/** يقبل المسارات الداخلية فقط، ويرفض أي رابط خارجي. */
function safeNextPath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/auth") || value.startsWith("/mfa-challenge")) return null;
  return value;
}

export const Route = createFileRoute("/_public/mfa-challenge")({
  head: () => ({
    meta: [
      { title: "تأكيد الدخول بخطوتين | Two-step verification | SyndeoCare" },
      {
        name: "description",
        content: "أدخل رمز التحقق من تطبيق المصادقة لإكمال تسجيل الدخول إلى حسابك في SyndeoCare.",
      },
      { property: "og:title", content: "تأكيد الدخول بخطوتين | Two-step verification | SyndeoCare" },
      { property: "og:description", content: "خطوة تحقق إضافية لحماية حسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MfaChallengePage,
});

const T = {
  title: { ar: "تأكيد الدخول بخطوتين", en: "Two-step verification" },
  subtitle: {
    ar: "افتح تطبيق المصادقة وأدخل الرمز المكوّن من ٦ أرقام.",
    en: "Open your authenticator app and enter the 6-digit code.",
  },
  code: { ar: "رمز التحقق", en: "Verification code" },
  verify: { ar: "تأكيد", en: "Verify" },
  verifying: { ar: "جارٍ التحقق...", en: "Verifying..." },
  invalid: { ar: "الرمز غير صحيح أو انتهت صلاحيته. جرّب الرمز الحالي في التطبيق.", en: "That code is incorrect or expired. Try the current code in your app." },
  short: { ar: "أدخل ٦ أرقام.", en: "Enter 6 digits." },
  checking: { ar: "جارٍ التحقق من حسابك...", en: "Checking your account..." },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  help: {
    ar: "لا تصلك الرموز؟ سجّل الخروج وتواصل معنا لاستعادة الوصول.",
    en: "Can't get codes? Sign out and contact us to recover access.",
  },
} as const;

type Phase = "checking" | "ready" | "none";

function MfaChallengePage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const t = (key: keyof typeof T) => T[key][lang === "ar" ? "ar" : "en"];

  const [phase, setPhase] = useState<Phase>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = safeNextPath(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next"),
  );

  const leave = useCallback(() => {
    void navigate({ to: next ?? "/dashboard", replace: true });
  }, [navigate, next]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (!aal || aal.nextLevel !== "aal2" || aal.currentLevel === "aal2") {
        // لا حاجة لتحدٍّ: إمّا لا يوجد عامل موثّق أو الجلسة مؤكَّدة أصلاً.
        setPhase("none");
        leave();
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (!active) return;
      if (!totp) {
        setPhase("none");
        leave();
        return;
      }
      setFactorId(totp.id);
      setPhase("ready");
    })();
    return () => {
      active = false;
    };
  }, [leave]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId) return;
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError(t("short"));
      return;
    }
    setBusy(true);
    setError(null);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setBusy(false);
      setError(t("invalid"));
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: clean,
    });
    setBusy(false);
    if (verifyError) {
      setCode("");
      setError(t("invalid"));
      return;
    }
    leave();
  };

  if (phase !== "ready") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("checking")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="text-lg font-bold">{t("title")}</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="mfa-code">{t("code")}</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              dir="ltr"
              className="h-12 text-center text-lg tracking-[0.4em]"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "mfa-error" : undefined}
            />
            {error ? (
              <p id="mfa-error" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="h-12 w-full" disabled={busy}>
            {busy ? t("verifying") : t("verify")}
          </Button>
        </form>

        <p className="mt-5 text-xs text-muted-foreground">{t("help")}</p>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 h-11 w-full"
          onClick={async () => {
            await supabase.auth.signOut();
            void navigate({ to: "/auth", replace: true });
          }}
        >
          {t("signOut")}
        </Button>
      </div>
    </div>
  );
}
