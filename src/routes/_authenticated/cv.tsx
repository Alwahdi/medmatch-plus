import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, credentialLabel, docTypeLabel, formatDate, specialtyName } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/cv")({
  head: () => ({
    meta: [
      { title: "سيرتي الذاتية ATS | SyndeoCare" },
      {
        name: "description",
        content: "سيرة ذاتية طبية بصيغة نصية بسيطة متوافقة مع أنظمة الفرز الآلي ATS، جاهزة للطباعة.",
      },
      { property: "og:title", content: "سيرة ذاتية ATS | SyndeoCare" },
      { property: "og:description", content: "سيرة ذاتية طبية متوافقة مع أنظمة الفرز الآلي." },
    ],
  }),
  component: CvPage,
});

const TXT = {
  ar: {
    completeTitle: "أكمل ملفك المهني أولاً",
    completeText: "نبني سيرتك تلقائياً من بيانات ملفك ووثائقك.",
    completeCta: "إكمال الملف المهني",
    title: "سيرتي الذاتية (ATS)",
    sub: "تنسيق نصي بسيط بدون جداول أو أعمدة — يقرأه نظام الفرز الآلي بدقة.",
    print: "طباعة / حفظ PDF",
    licenseNo: (n: string) => ` · رقم الترخيص: ${n}`,
    summary: "الملخص المهني",
    bioFallback: (specialty: string, years: number) => `كادر صحي في تخصص ${specialty} بخبرة ${years} سنة.`,
    unspecified: "غير محدد",
    specialtyExp: "التخصص والخبرة",
    specialtyLine: (s: string) => `التخصص: ${s}`,
    yearsLine: (n: number) => `سنوات الخبرة: ${n}`,
    licenseCountryLine: (c: string) => `دولة الترخيص: ${c}`,
    shiftReadinessLine: (v: string) => `الجاهزية للمناوبات: ${v}`,
    available: "متاح",
    unavailable: "غير متاح",
    creds: "المؤهلات والتراخيص",
    noCreds: "لم تُضف وثائق بعد —",
    addNow: "أضفها الآن",
  },
  en: {
    completeTitle: "Complete your professional profile first",
    completeText: "We build your CV automatically from your profile and documents.",
    completeCta: "Complete profile",
    title: "My CV (ATS)",
    sub: "A simple text format without tables or columns — read accurately by applicant tracking systems.",
    print: "Print / Save PDF",
    licenseNo: (n: string) => ` · License number: ${n}`,
    summary: "Professional summary",
    bioFallback: (specialty: string, years: number) => `Healthcare professional in ${specialty} with ${years} years of experience.`,
    unspecified: "Not specified",
    specialtyExp: "Specialty and experience",
    specialtyLine: (s: string) => `Specialty: ${s}`,
    yearsLine: (n: number) => `Years of experience: ${n}`,
    licenseCountryLine: (c: string) => `Country of license: ${c}`,
    shiftReadinessLine: (v: string) => `Available for shifts: ${v}`,
    available: "Yes",
    unavailable: "No",
    creds: "Qualifications and licenses",
    noCreds: "No documents added yet —",
    addNow: "Add now",
  },
} as const;

function CvPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();

  const { data: profile } = useQuery({
    queryKey: ["my-pro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("healthcare_professionals")
        .select("*,specialties(name_ar,name_en)")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: creds } = useQuery({
    queryKey: ["my-creds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("credentials")
        .select("*")
        .eq("user_id", user!.id)
        .order("issue_date", { ascending: false });
      return data ?? [];
    },
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">{c.completeTitle}</h1>
        <p className="mt-2 text-muted-foreground">{c.completeText}</p>
        <Button className="mt-6" asChild><Link to="/profile">{c.completeCta}</Link></Button>
      </div>
    );
  }

  const specialty = specialtyName(profile.specialties, lang) || c.unspecified;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {c.sub}
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> {c.print}
        </Button>
      </div>

      <article className="mt-6 rounded-2xl border border-border bg-card p-8 leading-relaxed print:border-0 print:p-0">
        <h2 className="font-display text-2xl font-extrabold">{profile.full_name}</h2>
        {profile.headline && <p className="text-muted-foreground">{profile.headline}</p>}
        <p className="mt-1 text-sm text-muted-foreground">
          {[profile.city, profile.country ? countryLabel(profile.country, lang) : null].filter(Boolean).join(lang === "en" ? ", " : "، ")}
          {profile.license_number ? c.licenseNo(profile.license_number) : ""}
        </p>

        <Section title={c.summary}>
          <p>
            {profile.bio || c.bioFallback(specialty, profile.years_experience)}
          </p>
        </Section>

        <Section title={c.specialtyExp}>
          <ul className="list-disc space-y-1 pe-5">
            <li>{c.specialtyLine(specialty)}</li>
            <li>{c.yearsLine(profile.years_experience)}</li>
            {profile.license_country && <li>{c.licenseCountryLine(countryLabel(profile.license_country, lang))}</li>}
            <li>{c.shiftReadinessLine(profile.is_open_to_shifts ? c.available : c.unavailable)}</li>
          </ul>
        </Section>

        <Section title={c.creds}>
          {creds?.length ? (
            <ul className="list-disc space-y-1 pe-5">
              {creds.map((cred) => (
                <li key={cred.id}>
                  {cred.title} — {docTypeLabel(cred.doc_type, lang)}
                  {cred.issuer ? ` — ${cred.issuer}` : ""}
                  {cred.issue_date ? ` (${formatDate(cred.issue_date, lang)})` : ""} — {credentialLabel(cred.status, lang)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              {c.noCreds} <Link to="/credentials" className="text-primary underline">{c.addNow}</Link>
            </p>
          )}
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="border-b border-border pb-1 font-bold">{title}</h3>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}
