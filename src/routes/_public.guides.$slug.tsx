import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { GUIDES, getGuide } from "@/content/guides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    allGuides: "كل الأدلة",
    readMinutes: (n: number) => `قراءة ${n} دقائق`,
    ctaTitle: "جاهز تطبّق ما قرأت؟",
    ctaSub: "أنشئ ملفك المهني مجاناً وابدأ التقديم على الوظائف والمناوبات.",
    createProfile: "إنشاء ملف مهني",
    browseJobs: "تصفح الوظائف",
    otherGuides: "أدلة أخرى",
    loadFailed: "تعذّر تحميل الدليل",
    backToGuides: "العودة للأدلة",
    notFoundTitle: "هذا الدليل غير موجود",
    browseAll: "تصفح كل الأدلة",
    metaFallback: "دليل | SyndeoCare",
  },
  en: {
    allGuides: "All guides",
    readMinutes: (n: number) => `${n} min read`,
    ctaTitle: "Ready to put this into practice?",
    ctaSub: "Create your free professional profile and start applying to jobs and shifts.",
    createProfile: "Create a profile",
    browseJobs: "Browse jobs",
    otherGuides: "Other guides",
    loadFailed: "Could not load the guide",
    backToGuides: "Back to guides",
    notFoundTitle: "This guide does not exist",
    browseAll: "Browse all guides",
    metaFallback: "Guide | SyndeoCare",
  },
} as const;

// English translations for guide content, keyed by slug (Arabic source lives in src/content/guides.ts)
const GUIDE_EN: Record<
  string,
  { title: string; description: string; category: string; sections: { heading: string; body: string[] }[] }
> = {
  "medical-cv-ats": {
    title: "How to write a medical CV that passes ATS systems",
    description:
      "A practical guide to writing a healthcare CV that gets through automated screening systems and reaches the hiring manager.",
    category: "Resume",
    sections: [
      {
        heading: "Why are resumes rejected before a human reads them?",
        body: [
          "Most large facilities use an automated screening system (ATS) that reads the resume text and searches for keywords related to the job: specialty, license, years of experience, and clinical skills.",
          "Any complex design — tables, multiple columns, images, or icons — may prevent the system from reading the text correctly, causing your resume to be scored as incomplete.",
        ],
      },
      {
        heading: "The recommended structure",
        body: [
          "1. Contact information: name, city, phone number, email.",
          "2. A two-line summary: specialty + years of experience + type of facilities you've worked in.",
          "3. License and professional registration: issuing body, registration number, expiry date.",
          "4. Experience: title, facility, duration, then 3–5 achievement bullet points.",
          "5. Education and certifications (BLS/ACLS/PALS, etc.).",
          "6. Clinical skills and systems (e.g. electronic health record systems).",
        ],
      },
      {
        heading: "Write achievements, not duties",
        body: [
          "Instead of \"Responsible for patient care,\" write \"Managed 18 beds in the internal medicine ward while reducing transfer wait time by 20%.\"",
          "A number gives the reviewer a clear measure and makes your resume stand out from dozens of similar applications.",
        ],
      },
      {
        heading: "Quick checklist",
        body: [
          "A text-based PDF file (not a scanned image).",
          "A clear font and a single column with no tables.",
          "The same job title as the posting appears in your resume.",
          "License expiry date is visible and current.",
          "No unexplained time gaps.",
        ],
      },
    ],
  },
  "license-verification-gulf": {
    title: "Professional license verification: what you need before applying",
    description:
      "The documents required to verify your professional license, and how to prepare them in advance to speed up your application.",
    category: "Licensing",
    sections: [
      {
        heading: "Why does pre-verification double your chances?",
        body: [
          "A facility that finds a candidate with a verified license saves weeks of paperwork, so verified applications are usually prioritized over others.",
          "On SyndeoCare, a verification badge appears on your profile, and facilities see it before opening your application.",
        ],
      },
      {
        heading: "Core documents",
        body: [
          "University degree + equivalency certificate if applicable.",
          "A valid professional registration or license certificate.",
          "Experience certificates verified by previous employers.",
          "Certificates for mandatory courses (BLS/ACLS depending on specialty).",
          "Passport and a personal photo.",
        ],
      },
      {
        heading: "Mistakes that delay acceptance",
        body: [
          "Unclear or cropped photos.",
          "An expired document, or one expiring within less than a month.",
          "Inconsistent spelling of your name across documents.",
          "Uploading a file in an unsupported format or one that's too large.",
        ],
      },
    ],
  },
  "locum-shifts-guide": {
    title: "A guide to locum shift work for healthcare professionals",
    description:
      "How to choose the right shifts, calculate your real hourly pay, and build a reputation that keeps facilities booking you.",
    category: "Shifts",
    sections: [
      {
        heading: "When does shift work make sense?",
        body: [
          "If you're looking for flexible hours, extra income alongside your regular job, or the chance to experience different work environments before committing to a permanent role.",
        ],
      },
      {
        heading: "Calculate your real pay",
        body: [
          "Start from the hourly rate, then subtract transport costs and lost time, and add any night-shift allowance if applicable.",
          "Compare the result to your current hourly pay before accepting a shift.",
        ],
      },
      {
        heading: "Build a reputation that gets you rebooked",
        body: [
          "Commit to arriving early, and report any unavoidable cancellation immediately.",
          "Read the shift notes before arriving: the department, the system used, and the number of beds.",
          "Facilities on SyndeoCare can see your reliability record — it speaks louder than any line on your resume.",
        ],
      },
    ],
  },
  "salary-negotiation-health": {
    title: "Negotiating your salary in the healthcare sector",
    description: "How to set a fair range, when to negotiate, and what beyond salary can be negotiated.",
    category: "Career path",
    sections: [
      {
        heading: "Know the market range first",
        body: [
          "Use the salary ranges published in SyndeoCare listings for your specialty and city as a realistic reference instead of guessing.",
        ],
      },
      {
        heading: "Timing is half the negotiation",
        body: [
          "Don't bring up salary in the first interview unless asked; your strongest negotiating position comes after the initial offer is made.",
        ],
      },
      {
        heading: "What can be negotiated besides the number?",
        body: [
          "Housing and transport allowances, travel tickets, the number of night shifts per month, leave days, and a budget for professional development and conferences.",
        ],
      },
    ],
  },
};

export const Route = createFileRoute("/_public/guides/$slug")({
  loader: ({ params }) => {
    const guide = getGuide(params.slug);
    if (!guide) throw notFound();
    return guide;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | SyndeoCare` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary" },
        ]
      : [{ title: "دليل | SyndeoCare" }],
  }),
  errorComponent: () => {
    const { lang } = useLang();
    const c = TXT[lang];
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold">{c.loadFailed}</h1>
        <Button className="mt-6" asChild>
          <Link to="/guides">{c.backToGuides}</Link>
        </Button>
      </div>
    );
  },
  notFoundComponent: () => {
    const { lang } = useLang();
    const c = TXT[lang];
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold">{c.notFoundTitle}</h1>
        <Button className="mt-6" asChild>
          <Link to="/guides">{c.browseAll}</Link>
        </Button>
      </div>
    );
  },
  component: GuidePage,
});

function GuidePage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const guide = Route.useLoaderData();
  const en = GUIDE_EN[guide.slug];
  const localized = lang === "en" && en ? en : guide;
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <article className="py-14">
      <div className="mx-auto max-w-3xl px-4">
        <Link to="/guides" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-4" /> {c.allGuides}
        </Link>
        <Badge variant="secondary" className="mt-5">{localized.category}</Badge>
        <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">{localized.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{localized.description}</p>
        <span className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {c.readMinutes(guide.readMinutes)}
        </span>

        <div className="mt-10 space-y-8">
          {localized.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-xl font-bold">{s.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center">
          <h2 className="font-display text-xl font-extrabold">{c.ctaTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {c.ctaSub}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/register">{c.createProfile}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jobs">{c.browseJobs}</Link>
            </Button>
          </div>
        </div>

        {others.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold">{c.otherGuides}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {others.map((g) => {
                const gEn = GUIDE_EN[g.slug];
                const title = lang === "en" && gEn ? gEn.title : g.title;
                return (
                  <Link
                    key={g.slug}
                    to="/guides/$slug"
                    params={{ slug: g.slug }}
                    className="card-lift rounded-xl border border-border bg-card p-4 text-sm font-bold"
                  >
                    {title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
