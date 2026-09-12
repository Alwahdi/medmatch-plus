import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getBank } from "@/content/question-banks";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    allBanks: "كل بنوك الأسئلة",
    howToAnswer: "كيف تجيب: ",
    ctaTitle: "استعد بالتقديم الفعلي",
    ctaSub: "تصفح الفرص المتاحة الآن في تخصصك.",
    browseJobs: "تصفح الوظائف",
    loadFailed: "تعذّر تحميل الصفحة",
    backToBanks: "العودة لبنوك الأسئلة",
    notFoundTitle: "بنك الأسئلة غير موجود",
    browseAll: "تصفح بنوك الأسئلة",
  },
  en: {
    allBanks: "All question banks",
    howToAnswer: "How to answer: ",
    ctaTitle: "Get ready with real applications",
    ctaSub: "Browse the opportunities currently available in your specialty.",
    browseJobs: "Browse jobs",
    loadFailed: "Could not load this page",
    backToBanks: "Back to question banks",
    notFoundTitle: "This question bank does not exist",
    browseAll: "Browse question banks",
  },
} as const;

// English translations for bank content, keyed by slug (Arabic source lives in src/content/question-banks.ts)
const BANK_EN: Record<
  string,
  {
    title: string;
    description: string;
    groups: { heading: string; questions: { q: string; hint: string }[] }[];
  }
> = {
  nursing: {
    title: "Nursing interview questions",
    description: "Frequently asked nursing interview questions with guidance for model answers.",
    groups: [
      {
        heading: "Clinical questions",
        questions: [
          {
            q: "How would you handle discovering a medication error after the dose was given?",
            hint: "Start with patient safety, then immediate reporting, documentation, follow-up, and finally learning from the incident without concealment.",
          },
          {
            q: "How do you prioritize care for four patients at once?",
            hint: "Explain a clear triage approach: the most critical case first, then time-bound tasks, then appropriate delegation.",
          },
          {
            q: "What are your steps when vital signs suddenly deteriorate?",
            hint: "Describe an organized sequence: assessment, calling the team, and starting the approved protocol.",
          },
        ],
      },
      {
        heading: "Behavioral questions",
        questions: [
          {
            q: "Tell us about a disagreement with a physician over a treatment plan.",
            hint: "Use the situation–task–action–result format, and focus on professional communication and the patient's best interest.",
          },
          {
            q: "How do you deal with an angry patient or family member?",
            hint: "Listen, acknowledge their feelings, clarify what can be done, and escalate when needed.",
          },
        ],
      },
    ],
  },
  physicians: {
    title: "Physician interview questions",
    description: "Common questions for residents and specialists, with what interviewers look for.",
    groups: [
      {
        heading: "Clinical competence",
        questions: [
          {
            q: "Describe a complex case you managed and what you learned from it.",
            hint: "Choose a real case, mention your differential diagnosis and decision and why, then the patient outcome.",
          },
          {
            q: "How do you handle diagnostic uncertainty?",
            hint: "Show a methodology: reassessment, consultation, and transparent documentation with the patient.",
          },
        ],
      },
      {
        heading: "Teamwork",
        questions: [
          {
            q: "How do you hand off a shift safely?",
            hint: "Mention a structured handoff tool and the critical information that must never be omitted.",
          },
          {
            q: "How do you balance workload pressure with quality of care?",
            hint: "Talk about prioritization, asking for support early, and never compromising on safety.",
          },
        ],
      },
    ],
  },
  pharmacy: {
    title: "Pharmacy interview questions",
    description: "Questions for hospital and community pharmacists.",
    groups: [
      {
        heading: "Pharmacy practice",
        questions: [
          {
            q: "How do you check for drug interactions before dispensing?",
            hint: "Mention your trusted references, and when you contact the prescribing physician.",
          },
          {
            q: "What do you do with a prescription for an unusual dose?",
            hint: "Do not dispense before confirming; explain the communication and documentation process.",
          },
        ],
      },
      {
        heading: "Quality and inventory",
        questions: [
          {
            q: "How do you manage high-risk medications?",
            hint: "Separation, labeling, double-checking, and dispensing records.",
          },
          {
            q: "How do you handle a shortage of an essential medication?",
            hint: "Therapeutic alternatives, coordination with the medical team, and early inventory reporting.",
          },
        ],
      },
    ],
  },
  "allied-health": {
    title: "Allied health interview questions",
    description: "For lab, radiology, physiotherapy and technician roles.",
    groups: [
      {
        heading: "Accuracy and safety",
        questions: [
          {
            q: "How do you ensure correct sample or patient identification?",
            hint: "At least two independent identifiers, and verification before any procedure.",
          },
          {
            q: "What do you do with a critical result?",
            hint: "The urgent reporting protocol and timestamped documentation.",
          },
        ],
      },
      {
        heading: "Operations",
        questions: [
          {
            q: "How do you handle a sudden equipment failure during your shift?",
            hint: "A backup plan, notifying maintenance, and informing the affected departments.",
          },
        ],
      },
    ],
  },
};

export const Route = createFileRoute("/_public/interview-questions/$slug")({
  loader: ({ params }) => {
    const bank = getBank(params.slug);
    if (!bank) throw notFound();
    return bank;
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
      : [{ title: "أسئلة المقابلات | SyndeoCare" }],
  }),
  errorComponent: () => {
    const { lang } = useLang();
    const c = TXT[lang];
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold">{c.loadFailed}</h1>
        <Button className="mt-6" asChild>
          <Link to="/interview-questions">{c.backToBanks}</Link>
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
          <Link to="/interview-questions">{c.browseAll}</Link>
        </Button>
      </div>
    );
  },
  component: BankPage,
});

function BankPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const bank = Route.useLoaderData();
  const en = BANK_EN[bank.slug];
  const localized = lang === "en" && en ? en : bank;

  return (
    <section className="py-14">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          to="/interview-questions"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4" /> {c.allBanks}
        </Link>
        <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">{localized.title}</h1>
        <p className="mt-3 text-muted-foreground">{localized.description}</p>

        <div className="mt-10 space-y-10">
          {localized.groups.map((g) => (
            <div key={g.heading}>
              <h2 className="font-display text-xl font-bold">{g.heading}</h2>
              <div className="mt-4 space-y-4">
                {g.questions.map((q) => (
                  <div key={q.q} className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-bold">{q.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.howToAnswer}</span>
                      {q.hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center">
          <h2 className="font-display text-xl font-extrabold">{c.ctaTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.ctaSub}</p>
          <Button className="mt-5" asChild>
            <Link to="/jobs">{c.browseJobs}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
