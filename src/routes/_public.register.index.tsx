import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, Building2, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/google-auth";
import { useSession } from "@/lib/auth";
import { resolveLanding } from "@/lib/landing";
import { useLang } from "@/lib/i18n";
import { ConsentNote } from "@/components/consent-note";
import { friendlyError } from "@/lib/user-errors";
import { PHONE_PLACEHOLDER_AR, PHONE_PLACEHOLDER_EN, isValidPhone, normalizePhone } from "@/lib/phone";
import { NOINDEX } from "@/lib/seo";

export const Route = createFileRoute("/_public/register/")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب كادر صحي | Create a professional account | SyndeoCare" },
      {
        name: "description",
        content:
          "أنشئ حساب باحث عن عمل واحد على SyndeoCare للوظائف والشيفتات المرنة والطلبات وملفك المهني.",
      },
      { property: "og:title", content: "إنشاء حساب كادر صحي | Create a professional account | SyndeoCare" },
      {
        property: "og:description",
        content: "حوّل خبرتك الطبية إلى فرصتك القادمة مع ملف مهني واضح وموثوق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      NOINDEX,
    ],
  }),
  component: RegisterSeeker,
});

const AR = {
  badge: "مصمم للرعاية الصحية",
  heroTitle: "حوّل خبرتك الطبية إلى فرصتك القادمة.",
  heroBody:
    "أنشئ حسابًا واحدًا كباحث عن عمل للوظائف والشيفتات المرنة والطلبات وملفك المهني.",
  b1: "أنشئ ملفًا مهنيًا تستخدمه دائمًا",
  b2: "اكتشف الوظائف والشيفتات في مكان واحد",
  b3: "تحكّم فيمن يمكنه الوصول إلى معلوماتك",
  secure: "نحمي حسابك بضوابط وصول صارمة، وتتحكم أنت فيمن يرى بياناتك.",
  joinAs: "سأنضم بصفتي",
  seeker: "باحث عن عمل",
  seekerHint: "طبيب - صيدلي - ممرض - فني",
  employer: "ناشر وظائف",
  employerHint: "وظّف الباحثين عن عمل",
  formTitle: "انضم إلى SyndeoCare كباحث عن عمل",
  google: "التسجيل عبر جوجل",
  or: "أو",
  name: "الاسم الكامل",
  namePh: "أدخل اسمك الكامل",
  phone: "رقم الجوال",
  phonePh: PHONE_PLACEHOLDER_AR,
  email: "البريد الإلكتروني",
  emailPh: "أدخل بريدك الإلكتروني",
  password: "كلمة المرور",
  passwordPh: "8 أحرف على الأقل",
  confirm: "تأكيد كلمة المرور",
  confirmPh: "تأكيد",
  submit: "إنشاء حساب",
  submitting: "جارٍ الإنشاء…",
  terms: "بإنشاء حساب، فإنك توافق على الشروط و سياسة الخصوصية.",
  have: "لديك حساب بالفعل؟",
  signin: "تسجيل الدخول",
  mismatch: "كلمتا المرور غير متطابقتين",
  invalid: "تحقق من صحة البيانات المدخلة",
  sent: "أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. افتح الرابط لتفعيل حسابك.",
  show: "إظهار كلمة المرور",
};

const EN: typeof AR = {
  badge: "Built for healthcare",
  heroTitle: "Turn your medical experience into your next opportunity.",
  heroBody:
    "Create one job seeker account for jobs, flexible shifts, applications and a professional profile with visible verification status.",
  b1: "Build a professional profile you keep using",
  b2: "Discover jobs and shifts in one place",
  b3: "Control who can access your information",
  secure: "We protect your account with strict access controls, and you decide who can see your data.",
  joinAs: "I'm joining as",
  seeker: "Job seeker",
  seekerHint: "Doctor - Pharmacist - Nurse - Technician",
  employer: "Employer",
  employerHint: "Hire job seekers",
  formTitle: "Join SyndeoCare as a job seeker",
  google: "Sign up with Google",
  or: "or",
  name: "Full name",
  namePh: "Enter your full name",
  phone: "Mobile number",
  phonePh: PHONE_PLACEHOLDER_EN,
  email: "Email",
  emailPh: "Enter your email",
  password: "Password",
  passwordPh: "At least 8 characters",
  confirm: "Confirm password",
  confirmPh: "Confirm",
  submit: "Create account",
  submitting: "Creating…",
  terms: "By creating an account you agree to the Terms and Privacy Policy.",
  have: "Already have an account?",
  signin: "Sign in",
  mismatch: "Passwords do not match",
  invalid: "Please check the information you entered",
  sent: "We sent a confirmation email. Open the link to activate your account.",
  show: "Show password",
};

function RegisterSeeker() {
  const { lang } = useLang();
  const L = lang === "ar" ? AR : EN;
  const navigate = useNavigate();
  const { user } = useSession();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

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

  async function googleSignUp() {
    setGoogleBusy(true);
    try {
      localStorage.setItem("sc_signup_intent", "professional");
    } catch {
      /* storage unavailable */
    }
    // العودة إلى صفحة عامة تتحقق من الجلسة ثم توجّه إلى الإعداد (مسار داخلي ثابت).
    const back = new URL("/auth", window.location.origin);
    back.searchParams.set("next", "/onboarding");
    const result = await signInWithGoogle(back.toString());

    if (result.error) {
      toast.error(L.invalid);
      setGoogleBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = "/onboarding";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({
        fullName: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(6).max(20).refine(isValidPhone),
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
      })
      .safeParse({ fullName, phone, email, password });
    if (!parsed.success) {
      toast.error(L.invalid);
      return;
    }
    if (password !== confirm) {
      toast.error(L.mismatch);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: parsed.data.fullName,
          // رقم الجوال يُحفظ في ملف الحساب عبر قاعدة البيانات، ويبقى بياناً خاصاً.
          phone: normalizePhone(parsed.data.phone),
          role: "professional",
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error, lang));
      return;
    }
    if (!data.session) {
      setSent(true);
      return;
    }
    navigate({ to: "/onboarding" });
  }

  return (
    <div className="soft-surface px-4 py-12">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
        <aside className="lg:sticky lg:top-24">
          <span className="section-label">{L.badge}</span>
          <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold sm:text-4xl">
            {L.heroTitle}
          </h1>
          <p className="mt-4 text-muted-foreground">{L.heroBody}</p>
          <ul className="mt-8 space-y-4">
            {[L.b1, L.b2, L.b3].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <Check className="size-3.5" />
                </span>
                <span className="text-sm font-medium">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex items-start gap-2 rounded-lg bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            {L.secure}
          </p>
        </aside>

        <div className="card-lift w-full rounded-lg border border-border bg-card p-6 sm:p-8">
          <p className="text-sm font-bold">{L.joinAs}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-primary bg-primary/8 p-4 text-start">
              <Briefcase className="size-5 text-primary" />
              <p className="mt-2 font-bold">{L.seeker}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{L.seekerHint}</p>
            </div>
            <Link
              to="/register/employer"
              className="rounded-lg border border-border p-4 text-start transition-colors hover:border-primary/40"
            >
              <Building2 className="size-5 text-primary" />
              <p className="mt-2 font-bold">{L.employer}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{L.employerHint}</p>
            </Link>
          </div>

          <h2 className="mt-8 font-display text-xl font-extrabold">{L.formTitle}</h2>

          {sent ? (
            <p className="mt-6 rounded-lg bg-secondary p-4 text-sm leading-relaxed">{L.sent}</p>
          ) : (
            <>
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={googleSignUp}
                disabled={googleBusy}
              >
                {L.google}
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> {L.or}
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="rs-name">{L.name}</Label>
                  <Input
                    id="rs-name"
                    value={fullName}
                    placeholder={L.namePh}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="rs-phone">{L.phone}</Label>
                  <Input
                    id="rs-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    placeholder={L.phonePh}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label htmlFor="rs-email">{L.email}</Label>
                  <Input
                    id="rs-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    placeholder={L.emailPh}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <PasswordField
                  id="rs-pass"
                  label={L.password}
                  placeholder={L.passwordPh}
                  value={password}
                  onChange={setPassword}
                  visible={showPass}
                  toggle={() => setShowPass((v) => !v)}
                  toggleLabel={L.show}
                />
                <PasswordField
                  id="rs-confirm"
                  label={L.confirm}
                  placeholder={L.confirmPh}
                  value={confirm}
                  onChange={setConfirm}
                  visible={showConfirm}
                  toggle={() => setShowConfirm((v) => !v)}
                  toggleLabel={L.show}
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? L.submitting : L.submit}
                </Button>
              </form>
            </>
          )}

          <ConsentNote className="mt-4" />
          <p className="mt-3 text-center text-sm">
            {L.have}{" "}
            <Link to="/auth" className="font-bold text-primary hover:underline">
              {L.signin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  visible,
  toggle,
  toggleLabel,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  toggle: () => void;
  toggleLabel: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          dir="ltr"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          maxLength={72}
          className="pe-10"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={toggleLabel}
          className="absolute inset-y-0 end-2 flex items-center text-muted-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
