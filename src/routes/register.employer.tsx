import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Building2, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { COUNTRIES, EMPLOYER_TYPES } from "@/lib/geo";

export const Route = createFileRoute("/register/employer")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب ناشر وظائف | SyndeoCare" },
      {
        name: "description",
        content:
          "أنشئ حساب ناشر وظائف على SyndeoCare وابدأ التوظيف في أقل من دقيقة مع تجربة مجانية 30 يومًا.",
      },
      { property: "og:title", content: "إنشاء حساب ناشر وظائف | SyndeoCare" },
      { property: "og:description", content: "ابدأ التوظيف خلال دقيقة، بدون بطاقة ائتمان." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterEmployer,
});

const AR = {
  back: "رجوع",
  badge: "مجاني للبدء",
  title: "أنشئ حساب ناشر وظائف",
  subtitle: "ابدأ التوظيف في أقل من دقيقة، وأكمل بيانات ناشر الوظائف لاحقًا عندما تكون جاهزًا.",
  included: "مشمولة مع التسجيل",
  trialTitle: "تجربة تسجيل ناشر الوظائف",
  trialNum: "30",
  trialUnit: "يوم مجانًا",
  trialBody: "احصل تلقائيًا على وصول لناشر الوظائف لمدة 30 يومًا بعد التسجيل وتأكيد البريد الإلكتروني.",
  t1: "تبدأ تلقائيًا بعد تأكيد البريد الإلكتروني",
  t2: "لا تحتاج إلى بطاقة دفع أو إتمام شراء",
  t3: "متاحة مرة واحدة وغير قابلة للتجديد",
  plans: "عرض التفاصيل والباقات المدفوعة",
  formTitle: "أنشئ حسابك",
  formBody: "أضف بيانات حسابك وموقعك، ثم يمكنك البدء. أضف نوع ناشر الوظائف والملف العام لاحقًا.",
  name: "الاسم",
  nameHint: "يُستخدم لحسابك ولاسم العرض الأولي لناشر الوظائف.",
  email: "البريد الإلكتروني",
  phone: "رقم الجوال",
  type: "نوع ناشر الوظائف",
  location: "الموقع",
  country: "الدولة",
  region: "المحافظة",
  city: "المدينة",
  password: "كلمة المرور",
  passwordHint: "8 أحرف فأكثر. استخدم مزيج من الأحرف والأرقام والرموز.",
  select: "اختر…",
  submit: "إنشاء الحساب",
  submitting: "جارٍ الإنشاء…",
  terms: "بإنشائك للحساب فأنت توافق على الشروط و سياسة الخصوصية",
  have: "لديك حساب بالفعل؟",
  signin: "سجّل الدخول",
  sideTitle: "ملف ناشر الوظائف",
  sideName: "اسمك",
  sideLater: "أكمل ملفك لاحقًا",
  s1: "وصول فوري إلى الباحثين عن عمل الموثّقين",
  s2: "انشر وظائف وشيفتات ضمن باقة أساسية مجانية",
  s3: "تابع طلبات التوظيف من لوحة تحكم مخصصة",
  f1: "ناشرو وظائف طبية موثقة فقط",
  f2: "توظيف خلال 24-72 ساعة",
  f3: "بدون بطاقة ائتمان",
  invalid: "تحقق من صحة البيانات المدخلة",
  sent: "أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. افتح الرابط لتفعيل حساب ناشر الوظائف.",
  show: "إظهار كلمة المرور",
};

const EN: typeof AR = {
  back: "Back",
  badge: "Free to start",
  title: "Create an employer account",
  subtitle: "Start hiring in under a minute and complete your employer details later.",
  included: "Included with sign-up",
  trialTitle: "Employer sign-up trial",
  trialNum: "30",
  trialUnit: "days free",
  trialBody: "Get employer access automatically for 30 days after signing up and confirming your email.",
  t1: "Starts automatically after email confirmation",
  t2: "No payment card or checkout required",
  t3: "Available once, non-renewable",
  plans: "See details and paid plans",
  formTitle: "Create your account",
  formBody: "Add your account and location details to get started. Add employer type and public profile later.",
  name: "Name",
  nameHint: "Used for your account and the initial employer display name.",
  email: "Email",
  phone: "Mobile number",
  type: "Employer type",
  location: "Location",
  country: "Country",
  region: "Governorate",
  city: "City",
  password: "Password",
  passwordHint: "8+ characters. Use a mix of letters, numbers and symbols.",
  select: "Select…",
  submit: "Create account",
  submitting: "Creating…",
  terms: "By creating an account you agree to the Terms and Privacy Policy",
  have: "Already have an account?",
  signin: "Sign in",
  sideTitle: "Employer profile",
  sideName: "Your name",
  sideLater: "Complete your profile later",
  s1: "Instant access to verified job seekers",
  s2: "Post jobs and shifts on a free starter plan",
  s3: "Track applications from a dedicated dashboard",
  f1: "Verified medical employers only",
  f2: "Hire within 24-72 hours",
  f3: "No credit card",
  invalid: "Please check the information you entered",
  sent: "We sent a confirmation email. Open the link to activate your employer account.",
  show: "Show password",
};

function RegisterEmployer() {
  const { lang } = useLang();
  const L = lang === "ar" ? AR : EN;
  const navigate = useNavigate();
  const { user } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/onboarding", replace: true });
  }, [user, navigate]);

  const countryObj = useMemo(() => COUNTRIES.find((c) => c.code === country), [country]);
  const regionObj = useMemo(
    () => countryObj?.regions.find((r) => r.en === region),
    [countryObj, region],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(255),
        phone: z.string().trim().min(6).max(20),
        type: z.string().min(1),
        country: z.string().min(1),
        region: z.string().min(1),
        city: z.string().min(1),
        password: z.string().min(8).max(72),
      })
      .safeParse({ name, email, phone, type, country, region, city, password });
    if (!parsed.success) {
      toast.error(L.invalid);
      return;
    }
    setBusy(true);
    const countryName = countryObj ? countryObj.ar : parsed.data.country;
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: parsed.data.name,
          phone: parsed.data.phone,
          role: "facility",
          facility_name: parsed.data.name,
          facility_type: parsed.data.type,
          country: countryName,
          region: parsed.data.region,
          city: parsed.data.city,
        },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    if (data.session && data.user) {
      await supabase.from("facilities").insert({
        user_id: data.user.id,
        name_ar: parsed.data.name,
        facility_type: parsed.data.type,
        country: countryName,
        city: parsed.data.city,
      });
      await supabase.rpc("claim_facility_role");
      setBusy(false);
      navigate({ to: "/facility" });
      return;
    }
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="soft-surface px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/register"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
          {L.back}
        </Link>

        <span className="section-label mt-6 inline-block">{L.badge}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{L.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{L.subtitle}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <section className="card-lift rounded-2xl border border-border bg-card p-6">
              <p className="text-xs font-bold text-muted-foreground">{L.included}</p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <p className="font-display text-lg font-extrabold">{L.trialTitle}</p>
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-extrabold text-primary">
                    {L.trialNum}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">{L.trialUnit}</span>
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{L.trialBody}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {[L.t1, L.t2, L.t3].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {i}
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
              >
                {L.plans}
              </Link>
            </section>

            <section className="card-lift rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-extrabold">{L.formTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{L.formBody}</p>

              {sent ? (
                <p className="mt-6 rounded-xl bg-secondary p-4 text-sm leading-relaxed">{L.sent}</p>
              ) : (
                <form onSubmit={submit} className="mt-6 space-y-5">
                  <div>
                    <Label htmlFor="re-name">{L.name} *</Label>
                    <Input
                      id="re-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={120}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{L.nameHint}</p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="re-email">{L.email} *</Label>
                      <Input
                        id="re-email"
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={255}
                      />
                    </div>
                    <div>
                      <Label htmlFor="re-phone">{L.phone} *</Label>
                      <Input
                        id="re-phone"
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{L.type} *</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={L.select} />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYER_TYPES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {lang === "ar" ? o.ar : o.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <p className="font-bold">{L.location}</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label>{L.country} *</Label>
                        <Select
                          value={country}
                          onValueChange={(v) => {
                            setCountry(v);
                            setRegion("");
                            setCity("");
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={L.select} />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {lang === "ar" ? c.ar : c.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{L.region} *</Label>
                        <Select
                          value={region}
                          onValueChange={(v) => {
                            setRegion(v);
                            setCity("");
                          }}
                          disabled={!countryObj}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={L.select} />
                          </SelectTrigger>
                          <SelectContent>
                            {(countryObj?.regions ?? []).map((rg) => (
                              <SelectItem key={rg.en} value={rg.en}>
                                {lang === "ar" ? rg.ar : rg.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{L.city} *</Label>
                        <Select value={city} onValueChange={setCity} disabled={!regionObj}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={L.select} />
                          </SelectTrigger>
                          <SelectContent>
                            {(regionObj?.cities ?? []).map((ct) => (
                              <SelectItem key={ct.en} value={lang === "ar" ? ct.ar : ct.en}>
                                {lang === "ar" ? ct.ar : ct.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="re-pass">{L.password} *</Label>
                    <div className="relative">
                      <Input
                        id="re-pass"
                        type={showPass ? "text" : "password"}
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        maxLength={72}
                        className="pe-10"
                      />
                      <button
                        type="button"
                        aria-label={L.show}
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute inset-y-0 end-2 flex items-center text-muted-foreground"
                      >
                        {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{L.passwordHint}</p>
                  </div>

                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? L.submitting : L.submit}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">{L.terms}</p>
                  <p className="text-center text-sm">
                    {L.have}{" "}
                    <Link to="/auth" className="font-bold text-primary hover:underline">
                      {L.signin}
                    </Link>
                  </p>
                </form>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="card-lift rounded-2xl border border-border bg-card p-6">
              <p className="text-xs font-bold text-muted-foreground">{L.sideTitle}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-6" />
                </span>
                <div>
                  <p className="font-bold">{name.trim() || L.sideName}</p>
                  <p className="text-xs text-muted-foreground">{L.sideLater}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm">
                {[L.s1, L.s2, L.s3].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-secondary p-6 text-sm">
              <ul className="space-y-2">
                {[L.f1, L.f2, L.f3].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
