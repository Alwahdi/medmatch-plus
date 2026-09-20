import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { assertOk } from "@/lib/query-errors";
import { useSession } from "@/lib/auth";
import { parseCv, type ParsedCv } from "@/lib/cv.functions";
import { useLang } from "@/lib/i18n";
import { friendlyError, UserFacingError } from "@/lib/user-errors";


const TXT = {
  ar: {
    title: "بناء الملف من سيرتك الذاتية",
    sub: "الصق نص سيرتك الذاتية، ونستخرج تخصصك وخبرتك وبيانات ترخيصك تلقائياً — ثم راجعها قبل الحفظ.",
    placeholder: "الصق هنا نص سيرتك الذاتية...",
    analyze: "حلّل السيرة",
    analyzing: "جارٍ التحليل...",
    manual: "تعبئة يدوية",
    resultTitle: "النتيجة المستخرجة",
    name: "الاسم",
    headline: "المسمى المهني",
    years: "سنوات الخبرة",
    specialty: "التخصص",
    country: "الدولة",
    city: "المدينة",
    licenseCountry: "دولة الترخيص",
    licenseNumber: "رقم الترخيص",
    save: "احفظ في ملفي المهني",
    saving: "جارٍ الحفظ...",
    tooShort: "الصق نص السيرة الذاتية كاملاً",
    genericHealthcare: "كادر صحي",
    saved: "تم بناء ملفك المهني",
    saveFailed: "تعذّر حفظ الملف — راجع بياناتك يدوياً",
    tooManyRequests: "الطلبات كثيرة الآن، جرّب بعد قليل.",
    cooldownMin: (m: number) => `بلغت الحد المسموح لتحليل السيرة الذاتية مؤقتاً. جرّب بعد ${m} دقيقة. نصّك المكتوب محفوظ كما هو.`,
    cooldownHour: (h: number) => `بلغت الحد المسموح لتحليل السيرة الذاتية اليوم. جرّب بعد ${h} ساعة. نصّك المكتوب محفوظ كما هو.`,
    noCredits: "رصيد الذكاء الاصطناعي غير كافٍ حالياً.",
    unavailable: "خدمة التحليل غير متاحة حالياً.",
    failed: "تعذّر تحليل السيرة الذاتية، جرّب نصاً أوضح.",
  },
  en: {
    title: "Build your profile from your CV",
    sub: "Paste your CV text and we'll extract your specialty, experience, and license details automatically — then review before saving.",
    placeholder: "Paste your CV text here...",
    analyze: "Analyze CV",
    analyzing: "Analyzing...",
    manual: "Fill manually",
    resultTitle: "Extracted result",
    name: "Name",
    headline: "Professional headline",
    years: "Years of experience",
    specialty: "Specialty",
    country: "Country",
    city: "City",
    licenseCountry: "Country of license",
    licenseNumber: "License number",
    save: "Save to my profile",
    saving: "Saving...",
    tooShort: "Paste your full CV text",
    genericHealthcare: "Healthcare professional",
    saved: "Your profile has been built",
    saveFailed: "Failed to save profile — please review your details manually",
    tooManyRequests: "Too many requests right now, try again shortly.",
    cooldownMin: (m: number) => `You've reached the CV analysis limit for now. Try again in ${m} min. Your text is preserved.`,
    cooldownHour: (h: number) => `You've reached today's CV analysis limit. Try again in ${h} h. Your text is preserved.`,
    noCredits: "AI credit is currently insufficient.",
    unavailable: "The analysis service is currently unavailable.",
    failed: "Failed to analyze the CV, try clearer text.",
  },
} as const;

export function CvImportPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const runParse = useServerFn(parseCv);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParsedCv | null>(null);

  const cooldownMessage = (seconds: number) => {
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return minutes >= 60 ? c.cooldownHour(Math.ceil(minutes / 60)) : c.cooldownMin(minutes);
  };

  const AI_ERRORS: Record<string, string> = {
    RATE_LIMIT: c.tooManyRequests,
    NO_CREDITS: c.noCredits,
    AI_UNAVAILABLE: c.unavailable,
    AI_FAILED: c.failed,
  };

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en");
      if (error) throw error;
      return data ?? [];
    },
  });

  const analyze = useMutation({
    mutationFn: async () => {
      if (text.trim().length < 50) throw new UserFacingError(c.tooShort);
      const res = await runParse({ data: { text: text.trim() } });
      if (res.error === "AI_RATE_LIMIT") {
        throw new UserFacingError(cooldownMessage(res.retryAfterSeconds ?? 3600));
      }
      if (!res.profile) throw new UserFacingError(AI_ERRORS[res.error ?? "AI_FAILED"] ?? c.failed);
      return res.profile;
    },
    onSuccess: (p) => setResult(p),
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!result) return;
      const hint = result.specialty_hint?.toLowerCase() ?? "";
      const specialty = specialties?.find(
        (s) => hint.includes(s.name_ar) || (s.name_en && hint.includes(s.name_en.toLowerCase())),
      );
      const { error } = await supabase.from("healthcare_professionals").upsert(
        {
          user_id: user!.id,
          full_name: result.full_name ?? c.genericHealthcare,
          headline: result.headline,
          years_experience: result.years_experience ?? 0,
          country: result.country,
          city: result.city,
          bio: result.bio,
          license_country: result.license_country,
          license_number: result.license_number,
          ...(specialty ? { specialty_id: specialty.id } : {}),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      // تفعيل دور الكادر بعد إنشاء الملف — حتى لا يعود المستخدم لشاشة الإعداد.
      assertOk(await supabase.rpc("claim_professional_role"));
    },
    onSuccess: () => {
      toast.success(c.saved);
      void queryClient.invalidateQueries({ queryKey: ["roles", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["my-pro", user?.id] });
      navigate({ to: "/profile" });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {c.sub}
      </p>

      <Textarea
        rows={12}
        className="mt-6"
        maxLength={20000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={c.placeholder}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => analyze.mutate()} loading={analyze.isPending}>
          <Sparkles className="size-4" /> {analyze.isPending ? c.analyzing : c.analyze}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/profile">{c.manual}</Link>
        </Button>
      </div>

      {result && (
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="font-bold">{c.resultTitle}</h2>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Field label={c.name} value={result.full_name} />
            <Field label={c.headline} value={result.headline} />
            <Field label={c.years} value={result.years_experience?.toString() ?? null} />
            <Field label={c.specialty} value={result.specialty_hint} />
            <Field label={c.country} value={result.country} />
            <Field label={c.city} value={result.city} />
            <Field label={c.licenseCountry} value={result.license_country} />
            <Field label={c.licenseNumber} value={result.license_number} />
          </dl>
          {result.bio && (
            <p className="mt-4 rounded-lg bg-surface p-4 text-sm leading-relaxed">{result.bio}</p>
          )}
          <Button className="mt-5" onClick={() => save.mutate()} loading={save.isPending}>
            {save.isPending ? c.saving : c.save}
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}
