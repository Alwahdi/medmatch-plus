import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, Building2, Loader2, RefreshCw, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Combobox, comboText } from "@/components/ui/combobox";
import { cityOptions, countryOptions } from "@/lib/geo";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "إعداد الحساب | SyndeoCare" },
      {
        name: "description",
        content: "أكمل بيانات حسابك على SyndeoCare لتصلك الفرص المناسبة لتخصصك أو لتبدأ التوظيف.",
      },
      { property: "og:title", content: "إعداد الحساب | SyndeoCare" },
      { property: "og:description", content: "خطوات سريعة لتجهيز ملفك المهني أو ملف منشأتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

type Path = "professional" | "facility" | null;

function Onboarding() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const ar = lang !== "en";

  const metaRole = (user?.user_metadata?.["role"] as Path) ?? null;
  const metaName = (user?.user_metadata?.["full_name"] as string | undefined) ?? "";

  const [path, setPath] = useState<Path>(null);
  const [ready, setReady] = useState(false);
  const [redirected, setRedirected] = useState(false);

  const {
    data: existing,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["onboarding-state", user?.id],
    enabled: !!user,
    retry: 1,
    staleTime: 10_000,
    queryFn: async () => {
      const [pro, fac] = await Promise.all([
        supabase.from("healthcare_professionals").select("id").eq("user_id", user!.id).maybeSingle(),
        supabase.from("facilities").select("id").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { pro: pro.data, fac: fac.data };
    },
  });

  // اختيار المسار المحفوظ (نية التسجيل أو بيانات الحساب) — لا يعتمد على نتيجة الفحص.
  useEffect(() => {
    if (path) return;
    let intent: Path = null;
    try {
      const stored = localStorage.getItem("sc_signup_intent");
      if (stored === "facility" || stored === "professional") intent = stored;
    } catch {
      /* storage unavailable */
    }
    const chosen = metaRole ?? intent;
    if (!chosen) return;
    setPath(chosen);
    try {
      localStorage.removeItem("sc_signup_intent");
    } catch {
      /* storage unavailable */
    }
  }, [metaRole, path]);

  // تحويل من لديه ملف جاهز — مرة واحدة فقط.
  useEffect(() => {
    if (redirected || !existing) return;
    if (existing.fac) {
      setRedirected(true);
      void navigate({ to: "/facility", replace: true });
      return;
    }
    if (existing.pro) {
      setRedirected(true);
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [existing, redirected, navigate]);

  // فتح الشاشة: عند وصول البيانات، أو خطأ، أو انقضاء مهلة قصيرة.
  useEffect(() => {
    if (ready) return;
    if (!isPending || isError) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => setReady(true), 6000);
    return () => clearTimeout(timer);
  }, [ready, isPending, isError]);

  if (!ready) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">{ar ? "جارٍ تجهيز حسابك…" : "Preparing your account…"}</p>
      </div>
    );
  }



  return (
    <div className="soft-surface px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold">{t("ob.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("ob.subtitle")}</p>

        {isError && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="size-4 text-destructive" />
            <span className="flex-1">
              {ar
                ? "تعذّر التحقق من حالة حسابك، لكن يمكنك المتابعة واختيار نوع الحساب."
                : "We couldn't check your account status, but you can continue and pick an account type."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}



        {path === null ? (
          <PathPicker onPick={setPath} />
        ) : path === "professional" ? (
          <ProfessionalSteps defaultName={metaName} />
        ) : (
          <FacilitySteps />
        )}
      </div>
    </div>
  );
}

function PathPicker({ onPick }: { onPick: (p: Path) => void }) {
  const { t } = useLang();
  return (
    <div className="mt-8">
      <p className="text-sm font-bold">{t("ob.pathTitle")}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPick("professional")}
          className="card-lift card-lift-hover rounded-2xl border border-border bg-card p-6 text-start"
        >
          <Stethoscope className="size-6 text-primary" />
          <p className="mt-3 font-bold">{t("auth.rolePro")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.roleProHint")}</p>
        </button>
        <button
          type="button"
          onClick={() => onPick("facility")}
          className="card-lift card-lift-hover rounded-2xl border border-border bg-card p-6 text-start"
        >
          <Building2 className="size-6 text-primary" />
          <p className="mt-3 font-bold">{t("auth.roleFacility")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.roleFacilityHint")}</p>
        </button>
      </div>
    </div>
  );
}

function Stepper({ step, total }: { step: number; total: number }) {
  const { t } = useLang();
  return (
    <div className="mt-8">
      <p className="text-xs font-bold text-muted-foreground">
        {t("ob.step").replace("{n}", String(step)).replace("{total}", String(total))}
      </p>
      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}

function ProfessionalSteps({ defaultName }: { defaultName: string }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const ct = comboText(lang);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: defaultName,
    headline: "",
    specialty_id: "",
    years_experience: 0,
    country: "",
    city: "",
    license_number: "",
    is_open_to_shifts: true,
  });

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id,name_ar")
        .order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const canNext = useMemo(() => {
    if (step === 1) return form.full_name.trim().length >= 2;
    if (step === 2) return !!form.specialty_id && !!form.country && form.city.trim().length >= 2;
    return true;
  }, [step, form]);

  async function finish() {
    const parsed = z
      .object({
        full_name: z.string().trim().min(2).max(100),
        years_experience: z.number().int().min(0).max(60),
      })
      .safeParse({ full_name: form.full_name, years_experience: Number(form.years_experience) });
    if (!parsed.success) {
      toast.error(t("ob.error"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("healthcare_professionals").upsert({
      user_id: user!.id,
      full_name: form.full_name.trim(),
      headline: form.headline.trim() || null,
      specialty_id: form.specialty_id || null,
      years_experience: Number(form.years_experience),
      country: form.country || null,
      city: form.city.trim() || null,
      license_number: form.license_number.trim() || null,
      license_country: form.country || null,
      is_open_to_shifts: form.is_open_to_shifts,
    }, { onConflict: "user_id" });
    if (error) {
      setBusy(false);
      toast.error(t("ob.error"));
      return;
    }
    const { data: claimed, error: claimError } = await supabase.rpc("claim_professional_role");
    if (claimError || !claimed) {
      setBusy(false);
      toast.error(t("ob.error"));
      return;
    }
    setBusy(false);
    toast.success(t("ob.done"));
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <>
      <Stepper step={step} total={3} />
      <div className="card-lift mt-4 space-y-4 rounded-2xl border border-border bg-card p-6">
        {step === 1 && (
          <>
            <p className="font-bold">{t("ob.pro.step1")}</p>
            <div>
              <Label htmlFor="ob-name">{t("ob.field.fullName")}</Label>
              <Input
                id="ob-name"
                maxLength={100}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ob-headline">{t("ob.field.headline")}</Label>
              <Input
                id="ob-headline"
                maxLength={150}
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="font-bold">{t("ob.pro.step2")}</p>
            <div>
              <Label>{t("ob.field.specialty")}</Label>
              <Combobox
                options={(specialties ?? []).map((s) => ({
                  value: s.id,
                  label: s.name_ar,
                  keywords: [s.name_ar],
                }))}
                value={form.specialty_id}
                onChange={(v) => setForm({ ...form, specialty_id: v })}
                placeholder={t("ob.selectPlaceholder")}
                searchPlaceholder={ct.search}
                emptyText={ct.empty}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ob-years">{t("ob.field.years")}</Label>
                <Input
                  id="ob-years"
                  type="number"
                  min={0}
                  max={60}
                  dir="ltr"
                  value={form.years_experience}
                  onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>{t("ob.field.country")}</Label>
                <Combobox
                  options={countryOptions(lang)}
                  value={form.country}
                  onChange={(v) => setForm({ ...form, country: v, city: "" })}
                  placeholder={t("ob.selectPlaceholder")}
                  searchPlaceholder={ct.search}
                  emptyText={ct.empty}
                />
              </div>
            </div>
            <div>
              <Label>{t("ob.field.city")}</Label>
              <Combobox
                options={cityOptions(form.country, lang)}
                value={form.city}
                disabled={!form.country}
                onChange={(v) => setForm({ ...form, city: v })}
                placeholder={form.country ? ct.choose : ct.pickCountryFirst}
                searchPlaceholder={ct.search}
                emptyText={ct.empty}
                allowCustom
                customLabel={ct.add}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="font-bold">{t("ob.pro.step3")}</p>
            <div>
              <Label htmlFor="ob-license">{t("ob.field.license")}</Label>
              <Input
                id="ob-license"
                maxLength={60}
                dir="ltr"
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="ob-shifts" className="cursor-pointer">
                {t("ob.field.openShifts")}
              </Label>
              <Switch
                id="ob-shifts"
                checked={form.is_open_to_shifts}
                onCheckedChange={(v) => setForm({ ...form, is_open_to_shifts: v })}
              />
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <p className="flex items-center gap-2 font-bold">
                <Sparkles className="size-4 text-accent" /> {t("ob.cvTitle")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("ob.cvBody")}</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/cv-import">{t("ob.cvCta")}</Link>
              </Button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                {t("ob.back")}
              </Button>
            )}
          </div>
          {step < 3 ? (
            <Button type="button" disabled={!canNext} onClick={() => setStep(step + 1)}>
              {t("ob.next")}
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={finish}>
              {busy ? t("ob.saving") : t("ob.finish")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

const FACILITY_TYPES = [
  { value: "hospital", ar: "مستشفى", en: "Hospital" },
  { value: "clinic", ar: "عيادة", en: "Clinic" },
  { value: "pharmacy", ar: "صيدلية", en: "Pharmacy" },
  { value: "lab", ar: "مختبر", en: "Laboratory" },
  { value: "center", ar: "مركز طبي", en: "Medical center" },
];

function FacilitySteps() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const ct = comboText(lang);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name_ar: "",
    facility_type: "hospital",
    country: "",
    city: "",
    website: "",
    description: "",
  });

  const canNext = form.name_ar.trim().length >= 2;

  async function finish() {
    const parsed = z
      .object({
        name_ar: z.string().trim().min(2).max(120),
        country: z.string().min(1),
        city: z.string().trim().min(2).max(60),
      })
      .safeParse(form);
    if (!parsed.success) {
      toast.error(t("ob.error"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("facilities").insert({
      user_id: user!.id,
      name_ar: form.name_ar.trim(),
      facility_type: form.facility_type,
      country: form.country,
      city: form.city.trim(),
      website: form.website.trim() || null,
      description: form.description.trim() || null,
    });
    if (error) {
      setBusy(false);
      toast.error(t("ob.error"));
      return;
    }
    await supabase.rpc("claim_facility_role");
    setBusy(false);
    toast.success(t("ob.done"));
    navigate({ to: "/facility", replace: true });
  }

  return (
    <>
      <Stepper step={step} total={2} />
      <div className="card-lift mt-4 space-y-4 rounded-2xl border border-border bg-card p-6">
        {step === 1 ? (
          <>
            <p className="font-bold">{t("ob.fac.step1")}</p>
            <div>
              <Label htmlFor="ob-fac-name">{t("ob.field.facName")}</Label>
              <Input
                id="ob-fac-name"
                maxLength={120}
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("ob.field.facType")}</Label>
              <Select
                value={form.facility_type}
                onValueChange={(v) => setForm({ ...form, facility_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_TYPES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {lang === "ar" ? f.ar : f.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <p className="font-bold">{t("ob.fac.step2")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t("ob.field.country")}</Label>
                <Combobox
                  options={countryOptions(lang)}
                  value={form.country}
                  onChange={(v) => setForm({ ...form, country: v, city: "" })}
                  placeholder={t("ob.selectPlaceholder")}
                  searchPlaceholder={ct.search}
                  emptyText={ct.empty}
                />
              </div>
              <div>
                <Label>{t("ob.field.city")}</Label>
                <Combobox
                  options={cityOptions(form.country, lang)}
                  value={form.city}
                  disabled={!form.country}
                  onChange={(v) => setForm({ ...form, city: v })}
                  placeholder={form.country ? ct.choose : ct.pickCountryFirst}
                  searchPlaceholder={ct.search}
                  emptyText={ct.empty}
                  allowCustom
                  customLabel={ct.add}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ob-fac-site">{t("ob.field.website")}</Label>
              <Input
                id="ob-fac-site"
                dir="ltr"
                maxLength={200}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ob-fac-desc">{t("ob.field.description")}</Label>
              <Textarea
                id="ob-fac-desc"
                maxLength={1000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              {t("ob.back")}
            </Button>
          ) : (
            <span />
          )}
          {step === 1 ? (
            <Button type="button" disabled={!canNext} onClick={() => setStep(2)}>
              {t("ob.next")}
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={finish}>
              {busy ? t("ob.saving") : t("ob.finish")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
