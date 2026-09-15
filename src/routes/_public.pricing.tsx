import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_public/pricing")({
  head: () => ({
    meta: [
      { title: "أسعار المنشآت — باقات التوظيف الطبي | SyndeoCare" },
      {
        name: "description",
        content:
          "باقات SyndeoCare للمنشآت الصحية: تجربة مجانية 30 يوماً، نشر وظائف ومناوبات، بحث المرشحين وأرصدة الذكاء الاصطناعي. الكادر الطبي يستخدم المنصة مجاناً.",
      },
      { property: "og:title", content: "أسعار المنشآت | SyndeoCare" },
      {
        property: "og:description",
        content: "تجربة مجانية 30 يوماً ثم باقات مرنة لنشر الوظائف والمناوبات الطبية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  code: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  price_monthly: number;
  price_yearly: number;
  list_price_monthly: number | null;
  currency: string;
  active_jobs: number;
  active_shifts: number;
  featured_jobs: number;
  urgent_shifts: number;
  candidate_searches: number;
  ai_credits: number;
  recruiter_seats: number;
  is_trial: boolean;
};

const TXT = {
  ar: {
    badge: "الكادر الطبي يستخدم المنصة مجاناً بالكامل",
    title: "باقات المنشآت الصحية",
    sub: "ابدأ بتجربة مجانية 30 يوماً بدون بطاقة دفع. تُفعّل تلقائياً لحظة تسجيل منشأتك، وتنشر خلالها وظائف ومناوبات حقيقية.",
    monthly: "شهري",
    yearly: "سنوي · شهران مجاناً",
    mostPopular: "الأكثر اختياراً",
    trialBadge: "30 يوماً",
    free: "مجاناً",
    perYear: "سنة",
    perMonth: "شهر",
    activeJobs: (n: number) => `${n} وظيفة نشطة`,
    activeShifts: (n: number) => `${n} مناوبة نشطة`,
    featuredJobs: (n: number) => `${n} إعلان مميّز`,
    urgentShifts: (n: number) => `${n} مناوبة مستعجلة`,
    candidateSearches: (n: number) => `${n} عملية بحث عن المرشحين شهرياً`,
    aiCredits: (n: number) => `${n} رصيد ذكاء اصطناعي`,
    seats: (n: number) => `${n} ${n > 1 ? "مقاعد" : "مقعد"} لمسؤولي التوظيف`,
    startTrial: "ابدأ التجربة المجانية",
    registerFacility: "سجّل منشأتك",
    whyHideTitle: "لماذا نُخفي اسم المنشأة؟",
    whyHideText:
      "إعلانات SyndeoCare مجهّلة الهوية: يرى الباحث المسمى والتخصص والراتب والموقع وشارة «ناشر موثّق»، بينما تظهر هوية المنشأة عند التواصل مع المرشح. هذا يحمي خطط التوظيف الداخلية للمنشأة ويمنع المقارنات غير العادلة بين الفرق.",
    proTitle: "هل أنت كادر صحي؟",
    proText: "استخدام SyndeoCare مجاني تماماً للباحثين عن عمل. أنشئ ملفك، وثّق ترخيصك، وتقدم على الوظائف والشيفتات بدون أي رسوم.",
    createFreeAccount: "إنشاء حساب مجاني",
  },
  en: {
    badge: "Healthcare professionals use the platform completely free",
    title: "Facility plans",
    sub: "Start with a 30-day free trial, no card required. It activates automatically as soon as you register your facility, and you can post real jobs and shifts during it.",
    monthly: "Monthly",
    yearly: "Yearly · 2 months free",
    mostPopular: "Most popular",
    trialBadge: "30 days",
    free: "Free",
    perYear: "year",
    perMonth: "month",
    activeJobs: (n: number) => `${n} active jobs`,
    activeShifts: (n: number) => `${n} active shifts`,
    featuredJobs: (n: number) => `${n} featured listing${n === 1 ? "" : "s"}`,
    urgentShifts: (n: number) => `${n} urgent shift${n === 1 ? "" : "s"}`,
    candidateSearches: (n: number) => `${n} candidate searches / month`,
    aiCredits: (n: number) => `${n} AI credits`,
    seats: (n: number) => `${n} recruiter seat${n > 1 ? "s" : ""}`,
    startTrial: "Start free trial",
    registerFacility: "Register your facility",
    whyHideTitle: "Why do we hide the facility name?",
    whyHideText:
      "SyndeoCare listings are anonymized: job seekers see the title, specialty, pay, location, and a “verified employer” badge, while the facility's identity is revealed once they contact a candidate. This protects your internal hiring plans and prevents unfair comparisons between teams.",
    proTitle: "Are you a healthcare professional?",
    proText: "Using SyndeoCare is completely free for job seekers. Create your profile, verify your license, and apply to jobs and shifts at no cost.",
    createFreeAccount: "Create a free account",
  },
} as const;

function PricingPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const [yearly, setYearly] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as Plan[];
    },
  });

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <Sparkles className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            {c.sub}
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex justify-center">
            <div className="inline-flex -translate-y-1/2 rounded-lg border border-border bg-card p-1.5 shadow-lg">
              <button
                onClick={() => setYearly(false)}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                  !yearly
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.monthly}
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                  yearly
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.yearly}
              </button>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans?.map((p) => {
              const price = yearly ? Number(p.price_yearly) : Number(p.price_monthly);
              const highlight = p.code === "pro";
              const name = lang === "en" ? p.name_en || p.name_ar : p.name_ar;
              return (
                <div
                  key={p.code}
                  className={`card-lift flex flex-col rounded-lg border bg-card p-6 ${
                    highlight ? "border-primary shadow-lg" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-bold">{name}</h2>
                    {highlight && <Badge>{c.mostPopular}</Badge>}
                    {p.is_trial && <Badge variant="secondary">{c.trialBadge}</Badge>}
                  </div>
                  <p className="mt-2 min-h-10 text-sm text-muted-foreground">{p.description_ar}</p>

                  <div className="mt-5">
                    <span className="font-display text-3xl font-extrabold text-primary">
                      {price === 0 ? c.free : formatMoney(price, p.currency, lang)}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / {yearly ? c.perYear : c.perMonth}
                      </span>
                    )}
                    {!yearly && p.list_price_monthly && (
                      <span className="mr-2 text-sm text-muted-foreground line-through">
                        {formatMoney(Number(p.list_price_monthly), p.currency, lang)}
                      </span>
                    )}
                  </div>

                  <ul className="mt-6 space-y-2.5 text-sm">
                    <Feature>{c.activeJobs(p.active_jobs)}</Feature>
                    <Feature>{c.activeShifts(p.active_shifts)}</Feature>
                    <Feature>{c.featuredJobs(p.featured_jobs)}</Feature>
                    <Feature>{c.urgentShifts(p.urgent_shifts)}</Feature>
                    <Feature>{c.candidateSearches(p.candidate_searches)}</Feature>
                    <Feature>{c.aiCredits(p.ai_credits)}</Feature>
                    <Feature>{c.seats(p.recruiter_seats)}</Feature>
                  </ul>

                  <Button
                    className="mt-6 w-full"
                    variant={highlight ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/register/employer">
                      {p.is_trial ? c.startTrial : c.registerFacility}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="card-lift rounded-lg border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-lg bg-accent/12 text-accent">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{c.whyHideTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.whyHideText}
              </p>
            </div>
            <div className="card-lift rounded-lg border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ArrowLeft className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{c.proTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.proText}
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link to="/register/employer">
                  {c.createFreeAccount}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
      <span>{children}</span>
    </li>
  );
}
