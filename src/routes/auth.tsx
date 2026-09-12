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
import { DICT, useLang } from "@/lib/i18n";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["professional", "facility"]).optional(),
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
      { property: "og:description", content: DICT["auth.subtitle"]!.ar },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8).max(72);
const nameSchema = z.string().trim().min(2).max(100);

function AuthPage() {
  const { mode, role: roleParam } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const { t } = useLang();
  const [tab, setTab] = useState(mode === "signup" ? "signup" : "signin");

  useEffect(() => {
    if (user) navigate({ to: "/onboarding", replace: true });
  }, [user, navigate]);

  const perks = [
    ["auth.side1", "auth.side1d"],
    ["auth.side2", "auth.side2d"],
    ["auth.side3", "auth.side3d"],
    ["auth.side4", "auth.side4d"],
  ] as const;

  return (
    <div className="soft-surface px-4 py-12">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        <aside className="hidden lg:block">
          <h2 className="font-display text-3xl leading-tight font-extrabold">{t("auth.sideTitle")}</h2>
          <ul className="mt-8 space-y-5">
            {perks.map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <Check className="size-3.5" />
                </span>
                <div>
                  <p className="font-bold">{t(title)}</p>
                  <p className="text-sm text-muted-foreground">{t(desc)}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="card-lift w-full max-w-md justify-self-center rounded-2xl border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-extrabold">{t("auth.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signin")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm initialRole={roleParam ?? "professional"} />
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t("auth.or")}{" "}
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton />
          <p className="mt-4 text-center text-xs text-muted-foreground">{t("auth.terms")}</p>
        </div>
      </div>
    </div>
  );
}

function GoogleButton() {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("auth.googleError"));
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = "/onboarding";
  }
  return (
    <Button variant="outline" className="w-full" onClick={signIn} disabled={busy}>
      {t("auth.google")}
    </Button>
  );
}

function SignInForm() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = z
      .object({ email: emailSchema, password: z.string().min(1) })
      .safeParse({ email, password });
    if (!parsed.success) {
      toast.error(t("auth.badCreds"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(t("auth.badCreds"));
      return;
    }
    toast.success(t("auth.signedIn"));
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div>
        <Label htmlFor="si-email">{t("auth.email")}</Label>
        <Input
          id="si-email"
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
        />
      </div>
      <div>
        <Label htmlFor="si-pass">{t("auth.password")}</Label>
        <Input
          id="si-pass"
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={72}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.signingIn") : t("auth.doSignIn")}
      </Button>
    </form>
  );
}

function SignUpForm({ initialRole }: { initialRole: "professional" | "facility" }) {
  const { t } = useLang();
  const [role, setRole] = useState<"professional" | "facility">(initialRole);
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
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: parsed.data.fullName, role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSent(true);
      return;
    }
    toast.success(t("ob.title"));
  }

  if (sent) {
    return (
      <p className="mt-6 rounded-xl bg-secondary p-4 text-sm leading-relaxed">{t("auth.confirmSent")}</p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div>
        <p className="mb-2 text-sm font-bold">{t("auth.roleQuestion")}</p>
        <div className="grid grid-cols-2 gap-2">
          <RoleTile
            active={role === "professional"}
            onClick={() => setRole("professional")}
            icon={<Stethoscope className="mb-1 size-4 text-primary" />}
            title={t("auth.rolePro")}
            hint={t("auth.roleProHint")}
          />
          <RoleTile
            active={role === "facility"}
            onClick={() => setRole("facility")}
            icon={<Building2 className="mb-1 size-4 text-primary" />}
            title={t("auth.roleFacility")}
            hint={t("auth.roleFacilityHint")}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="su-name">{role === "facility" ? t("auth.contactName") : t("auth.fullName")}</Label>
        <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
      </div>
      <div>
        <Label htmlFor="su-email">{t("auth.email")}</Label>
        <Input
          id="su-email"
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
        />
      </div>
      <div>
        <Label htmlFor="su-pass">{t("auth.password")}</Label>
        <Input
          id="su-pass"
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={72}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.signingUp") : t("auth.doSignUp")}
      </Button>
    </form>
  );
}

function RoleTile({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-start text-sm transition-colors ${
        active ? "border-primary bg-primary/8" : "border-border hover:border-primary/40"
      }`}
    >
      {icon}
      <span className="block font-bold">{title}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}
