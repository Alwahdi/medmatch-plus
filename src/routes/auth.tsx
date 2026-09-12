import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Stethoscope, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/auth";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول وإنشاء حساب | SyndeoCare" },
      {
        name: "description",
        content: "أنشئ حسابك ككادر صحي أو منشأة صحية وابدأ التوظيف على منصة SyndeoCare.",
      },
      { property: "og:title", content: "تسجيل الدخول | SyndeoCare" },
      { property: "og:description", content: "حساب واحد للوظائف والمناوبات وتوثيق التراخيص." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("بريد إلكتروني غير صحيح").max(255);
const passwordSchema = z.string().min(8, "كلمة المرور يجب أن تكون ٨ أحرف على الأقل").max(72);
const nameSchema = z.string().trim().min(2, "الاسم قصير جداً").max(100);

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [tab, setTab] = useState(mode === "signup" ? "signup" : "signin");

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  return (
    <div className="soft-surface px-4 py-12">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        <aside className="hidden lg:block">
          <h2 className="font-display text-3xl leading-tight font-extrabold">
            حساب واحد يفتح لك سوق العمل الطبي العربي
          </h2>
          <ul className="mt-8 space-y-5">
            {[
              ["وظائف بأجر معلن", "كل إعلان يعرض نطاق الراتب — لا مفاوضات في الظلام."],
              ["مناوبات تُحجز بنقرة", "غطِّ يومك الحر بمناوبة قريبة منك بأجر بالساعة واضح."],
              ["توثيق مرة واحدة", "ارفع ترخيصك وشهاداتك، واستخدمها في كل تقديم."],
              ["سيرة ATS جاهزة", "نبني سيرتك تلقائياً بصيغة تقرأها أنظمة الفرز."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <Check className="size-3.5" />
                </span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

      <div className="card-lift w-full max-w-md justify-self-center rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-extrabold">أهلاً بك في SyndeoCare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          حساب واحد للوظائف والمناوبات وتوثيق التراخيص.
        </p>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="signup">حساب جديد</TabsTrigger>
          </TabsList>
          <TabsContent value="signin"><SignInForm /></TabsContent>
          <TabsContent value="signup"><SignUpForm /></TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleButton />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          بإنشاء حسابك أنت توافق على استخدام بياناتك لأغراض التوظيف داخل المنصة فقط.
        </p>
      </div>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("تعذّر تسجيل الدخول عبر Google");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = "/dashboard";
  }
  return (
    <Button variant="outline" className="w-full" onClick={signIn} disabled={busy}>
      المتابعة باستخدام Google
    </Button>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = z.object({ email: emailSchema, password: z.string().min(1, "أدخل كلمة المرور") })
      .safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) { toast.error("بيانات الدخول غير صحيحة"); return; }
    toast.success("تم تسجيل الدخول");
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div>
        <Label htmlFor="si-email">البريد الإلكتروني</Label>
        <Input id="si-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
      </div>
      <div>
        <Label htmlFor="si-pass">كلمة المرور</Label>
        <Input id="si-pass" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "جارٍ الدخول..." : "دخول"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [role, setRole] = useState<"professional" | "facility">("professional");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = z
      .object({ fullName: nameSchema, email: emailSchema, password: passwordSchema })
      .safeParse({ fullName, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName, role },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) {
      setSent(true);
      return;
    }
    toast.success("تم إنشاء الحساب");
  }

  if (sent) {
    return (
      <p className="mt-6 rounded-xl bg-secondary p-4 text-sm leading-relaxed">
        أرسلنا رسالة تأكيد إلى بريدك. افتح الرابط داخلها لتفعيل حسابك ثم عد لتسجيل الدخول.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole("professional")}
          className={`rounded-xl border p-3 text-right text-sm transition-colors ${role === "professional" ? "border-primary bg-primary/8" : "border-border"}`}
        >
          <Stethoscope className="mb-1 size-4 text-primary" />
          كادر صحي
        </button>
        <button
          type="button"
          onClick={() => setRole("facility")}
          className={`rounded-xl border p-3 text-right text-sm transition-colors ${role === "facility" ? "border-primary bg-primary/8" : "border-border"}`}
        >
          <Building2 className="mb-1 size-4 text-primary" />
          منشأة صحية
        </button>
      </div>
      <div>
        <Label htmlFor="su-name">{role === "facility" ? "اسم المسؤول" : "الاسم الكامل"}</Label>
        <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
      </div>
      <div>
        <Label htmlFor="su-email">البريد الإلكتروني</Label>
        <Input id="su-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
      </div>
      <div>
        <Label htmlFor="su-pass">كلمة المرور</Label>
        <Input id="su-pass" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
      </Button>
    </form>
  );
}
