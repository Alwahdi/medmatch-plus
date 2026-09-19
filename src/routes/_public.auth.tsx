import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Bookmark,
  Building2,
  Eye,
  EyeOff,
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/auth";
import { resolveLanding } from "@/lib/landing";
import { DICT, useLang } from "@/lib/i18n";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["professional", "facility"]).optional(),
  /** المسار الذي حاول المستخدم فتحه قبل تسجيل الدخول (داخلي فقط). */
  next: z.string().optional(),
});

/** يقبل المسارات الداخلية فقط، ويرفض أي رابط خارجي. */
function safeNext(value: string | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/auth")) return null;
  return value;
}

export const Route = createFileRoute("/_public/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | Sign in | SyndeoCare" },
      {
        name: "description",
        content: "سجّل دخولك إلى حسابك في SyndeoCare وتابع طلباتك وفرصك المحفوظة وملفك المهني.",
      },
      { property: "og:title", content: "تسجيل الدخول | Sign in | SyndeoCare" },
      { property: "og:description", content: DICT["auth.subtitle"]!.ar },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);

const TXT = {
  badge: { ar: "سجّل الآن", en: "Join now" },
  panelTitle: {
    ar: "سجّل وابدأ في متابعة أحدث الفرص المناسبة لتخصصك.",
    en: "Sign up and follow the latest opportunities matching your specialty.",
  },
  panelSub: {
    ar: "عُد إلى طلباتك وفرصك المحفوظة وملفك المهني من دون أن تفقد ما أنجزته.",
    en: "Come back to your applications, saved jobs and professional profile without losing your progress.",
  },
  p1: { ar: "ارجع إلى الوظائف والطلبات المحفوظة", en: "Return to saved jobs and applications" },
  p2: { ar: "تقدّم من دون تكرار بياناتك", en: "Apply without re-entering your data" },
  p3: { ar: "حافظ على خصوصية ملفك وسيرتك الذاتية", en: "Keep your profile and CV private" },
  secure: {
    ar: "بيانات حسابك محمية بتشفير قوي في جميع مساحات عمل SyndeoCare.",
    en: "Your account data is protected with strong encryption across SyndeoCare.",
  },
  welcome: { ar: "مرحباً بعودتك", en: "Welcome back" },
  welcomeSub: { ar: "سجّل دخولك إلى حسابك في SyndeoCare", en: "Sign in to your SyndeoCare account" },
  google: { ar: "المتابعة عبر جوجل", en: "Continue with Google" },
  or: { ar: "أو", en: "or" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  emailPh: { ar: "أدخل بريدك الإلكتروني", en: "Enter your email" },
  password: { ar: "كلمة المرور", en: "Password" },
  passwordPh: { ar: "أدخل كلمة المرور", en: "Enter your password" },
  showPassword: { ar: "إظهار كلمة المرور", en: "Show password" },
  hidePassword: { ar: "إخفاء كلمة المرور", en: "Hide password" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  signingIn: { ar: "جارٍ تسجيل الدخول...", en: "Signing in..." },
  forgot: { ar: "نسيت كلمة المرور؟", en: "Forgot your password?" },
  resetSent: {
    ar: "أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.",
    en: "We sent a password reset link to your email.",
  },
  resetNeedEmail: {
    ar: "اكتب بريدك الإلكتروني أولاً ثم اضغط نسيت كلمة المرور.",
    en: "Enter your email first, then click forgot password.",
  },
  seekerQ: { ar: "هل أنت باحث عن عمل؟", en: "Are you a job seeker?" },
  seekerCta: { ar: "سجّل كباحث عن عمل", en: "Register as a job seeker" },
  employerQ: { ar: "هل أنت ناشر وظائف؟", en: "Are you an employer?" },
  employerCta: { ar: "سجّل كناشر وظائف", en: "Register as an employer" },
  badCreds: { ar: "بيانات الدخول غير صحيحة", en: "Invalid sign-in details" },
  signedIn: { ar: "تم تسجيل الدخول", en: "Signed in" },
  googleError: { ar: "تعذّر تسجيل الدخول عبر جوجل", en: "Google sign-in failed" },
  newHere: { ar: "جديد على المنصة؟ اختر نوع حسابك", en: "New here? Choose your account type" },
  typeHint: {
    ar: "لكل بريد حساب واحد: إما كادر صحي يبحث عن عمل، أو منشأة تنشر الوظائف والمناوبات.",
    en: "One account type per email: a healthcare professional looking for work, or a facility posting jobs and shifts.",
  },
} as const;

function AuthPage() {
  const { mode, role: roleParam } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const { lang } = useLang();
  const tx = (k: keyof typeof TXT) => TXT[k][lang === "en" ? "en" : "ar"];

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    resolveLanding(user.id).then((to) => {
      if (!cancelled) navigate({ to, replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  useEffect(() => {
    if (mode !== "signup") return;
    navigate({
      to: roleParam === "facility" ? "/register/employer" : "/register",
      replace: true,
    });
  }, [mode, roleParam, navigate]);

  const perks = [
    { icon: <Bookmark className="size-4" />, text: tx("p1") },
    { icon: <Zap className="size-4" />, text: tx("p2") },
    { icon: <ShieldCheck className="size-4" />, text: tx("p3") },
  ];

  return (
    <div className="bg-background px-4 py-8 sm:py-12">
      <div className="card-lift mx-auto grid max-w-5xl overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-2">
        <div className="order-2 p-6 sm:p-10 lg:order-1">
          <div className="mx-auto w-full max-w-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <LogIn className="size-5" />
            </div>
            <h1 className="mt-4 text-center font-display text-2xl font-extrabold">{tx("welcome")}</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">{tx("welcomeSub")}</p>

            <div className="mt-6">
              <GoogleButton label={tx("google")} errorText={tx("googleError")} />
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {tx("or")}
              <span className="h-px flex-1 bg-border" />
            </div>

            <SignInForm tx={tx} />

            <div className="mt-6 rounded-lg bg-secondary/60 p-3">
              <p className="text-center text-xs font-semibold">{tx("newHere")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link
                  to="/register"
                  className="rounded-lg border border-border bg-card p-3 text-start transition-colors hover:border-primary/50"
                >
                  <UserRound className="size-5 text-primary" />
                  <p className="mt-2 text-sm font-bold">{tx("seekerCta")}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{tx("seekerQ")}</p>
                </Link>
                <Link
                  to="/register/employer"
                  className="rounded-lg border border-border bg-card p-3 text-start transition-colors hover:border-primary/50"
                >
                  <Building2 className="size-5 text-primary" />
                  <p className="mt-2 text-sm font-bold">{tx("employerCta")}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{tx("employerQ")}</p>
                </Link>
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                {tx("typeHint")}
              </p>
            </div>
          </div>
        </div>

        <aside className="order-1 flex flex-col justify-between gap-10 bg-accent p-8 text-accent-foreground sm:p-10 lg:order-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md bg-background/10 px-3 py-1 text-xs font-bold text-accent-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              {tx("badge")}
            </span>
            <h2 className="mt-5 text-2xl leading-snug font-bold">{tx("panelTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-accent-foreground/80">{tx("panelSub")}</p>

            <ul className="mt-8 space-y-3">
              {perks.map((perk) => (
                <li
                  key={perk.text}
                  className="flex items-center gap-3 rounded-lg bg-background/10 px-4 py-3 text-sm font-medium"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/10 text-accent-foreground">
                    {perk.icon}
                  </span>
                  {perk.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3 border-t border-background/15 pt-6 text-xs text-accent-foreground/75">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/10 text-accent-foreground">
              <ShieldCheck className="size-4" />
            </span>
            {tx("secure")}
          </div>
        </aside>
      </div>
    </div>
  );
}

function GoogleButton({ label, errorText }: { label: string; errorText: string }) {
  const [busy, setBusy] = useState(false);
  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(errorText);
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = "/onboarding";
  }
  return (
    <Button variant="outline" className="h-11 w-full" onClick={signIn} disabled={busy}>
      <GoogleIcon />
      {label}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.8 6.1C12.3 13.7 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.6z"
      />
      <path fill="#FBBC05" d="M10.4 28.2a14.5 14.5 0 0 1 0-8.4l-7.8-6.1a24 24 0 0 0 0 20.6l7.8-6.1z" />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.5-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.7-4.2-13.6-9.9l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"
      />
    </svg>
  );
}

function SignInForm({ tx }: { tx: (k: keyof typeof TXT) => string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = z
      .object({ email: emailSchema, password: z.string().min(1) })
      .safeParse({ email, password });
    if (!parsed.success) {
      toast.error(tx("badCreds"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(tx("badCreds"));
      return;
    }
    toast.success(tx("signedIn"));
  }

  async function reset(): Promise<void> {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(tx("resetNeedEmail"));
      return;
    }
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth`,
    });
    toast.success(tx("resetSent"));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="si-email">{tx("email")}</Label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="si-email"
            type="email"
            dir="ltr"
            placeholder={tx("emailPh")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className="h-11 rounded-lg ps-9 text-start"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="si-pass">{tx("password")}</Label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="si-pass"
            type={show ? "text" : "password"}
            dir="ltr"
            placeholder={tx("passwordPh")}
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
            className="absolute top-1/2 end-0 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? tx("hidePassword") : tx("showPassword")}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
           </Button>
        </div>
      </div>
      <Button type="submit" className="h-11 w-full rounded-lg" disabled={busy}>
        {busy ? tx("signingIn") : tx("signIn")}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={reset}
        className="w-full text-center"
      >
        {tx("forgot")}
      </Button>
    </form>
  );
}
