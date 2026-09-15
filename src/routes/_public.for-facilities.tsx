import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, ShieldCheck, Users, Sparkles, ArrowLeft, Bell, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useMyFacility, useSession } from "@/lib/auth";

export const Route = createFileRoute("/_public/for-facilities")({
  head: () => ({
    meta: [
      { title: "للمنشآت الصحية | وظّف كوادر موثّقة | SyndeoCare" },
      {
        name: "description",
        content:
          "انشر وظائفك ومناوباتك على SyndeoCare، واستقبل كوادر صحية موثّقة التراخيص مع لوحة فرز واضحة للمتقدمين.",
      },
      { property: "og:title", content: "للمنشآت الصحية | SyndeoCare" },
      { property: "og:description", content: "وظّف كوادر صحية موثّقة وغطِّ مناوباتك خلال ساعات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForFacilities,
});

const TXT = {
  ar: {
    badge: "للمستشفيات والعيادات والمجمعات الطبية",
    title: "غطِّ نقص الكوادر خلال ساعات، لا أسابيع",
    sub: "SyndeoCare يمنح المستشفيات والعيادات والمجمعات الطبية قناة مباشرة إلى كوادر صحية موثّقة — للوظائف الدائمة وللمناوبات العاجلة معاً.",
    registerFree: "سجّل منشأتك مجاناً",
    stepsLabel: "كيف تعمل المنصة",
    stepsTitle: "أربع خطوات للتوظيف السريع",
    steps: [
      { title: "سجّل منشأتك", text: "أنشئ ملف المنشأة: النوع، المدينة، ونبذة تعريفية." },
      { title: "انشر وظيفة أو مناوبة", text: "حدّد التخصص ونطاق الراتب أو الأجر بالساعة." },
      { title: "استقبل كوادر موثّقة", text: "كل متقدم يعرض تخصصه وخبرته وحالة توثيق ترخيصه." },
      { title: "أدر الفرز حتى التعيين", text: "حرّك الطلب بين المراحل: مراجعة، مقابلة، عرض، تعيين." },
    ],
    whyLabel: "ما الذي يميّزنا",
    whyTitle: "لماذا تنشر على SyndeoCare؟",
    benefits: [
      ["تراخيص موثّقة مسبقاً", "لا تضيّع وقتك في ملاحقة الوثائق: ملف الاعتماد يُراجع قبل التقديم."],
      ["تغطية مناوبات فورية", "انشر المناوبة الليلة، واحصل على حجز خلال دقائق."],
      ["تكلفة أقل من الوساطة", "بدون عمولات وكالات التوظيف التقليدية."],
      ["تنبيهات فورية", "يصلك تنبيه لحظة تقدّم أي مرشّح مناسب."],
      ["خصوصية هوية المنشأة", "اكشف اسم منشأتك فقط عند التواصل الجاد مع المرشح."],
      ["بيانات ومطابقة ذكية", "قارن المرشحين بناءً على التخصص والخبرة والترخيص."],
    ],
    registerNow: "سجّل منشأتك الآن",
    learnMore: "تعرّف على طريقة العمل",
  },
  en: {
    badge: "For hospitals, clinics, and medical complexes",
    title: "Cover staffing shortages in hours, not weeks",
    sub: "SyndeoCare gives hospitals, clinics, and medical complexes a direct channel to verified healthcare professionals — for permanent jobs and urgent shifts alike.",
    registerFree: "Register your facility for free",
    stepsLabel: "How it works",
    stepsTitle: "Four steps to fast hiring",
    steps: [
      { title: "Register your facility", text: "Create your facility profile: type, city, and a short description." },
      { title: "Post a job or shift", text: "Set the specialty and the salary range or hourly pay." },
      { title: "Receive verified candidates", text: "Every applicant shows their specialty, experience, and license verification status." },
      { title: "Manage screening to hire", text: "Move applications through stages: review, interview, offer, hired." },
    ],
    whyLabel: "What sets us apart",
    whyTitle: "Why post on SyndeoCare?",
    benefits: [
      ["Pre-verified licenses", "Don't waste time chasing documents: credential files are reviewed before applying."],
      ["Instant shift coverage", "Post tonight's shift and get it booked within minutes."],
      ["Lower cost than agencies", "No traditional recruitment agency commissions."],
      ["Instant alerts", "Get notified the moment a qualified candidate applies."],
      ["Facility identity privacy", "Only reveal your facility's name once you seriously engage with a candidate."],
      ["Smart data & matching", "Compare candidates by specialty, experience, and license."],
    ],
    registerNow: "Register your facility now",
    learnMore: "See how it works",
  },
} as const;

function ForFacilities() {
  const { lang } = useLang();
  const { user } = useSession();
  const { data: myFacility } = useMyFacility(user);
  const employerHref = !user ? "/register/employer" : myFacility ? "/facility" : "/onboarding";
  const c = TXT[lang];
  const stepIcons: LucideIcon[] = [ClipboardList, Users, ShieldCheck, CalendarClock];

  return (
    <>
      <div className="pb-24 md:pb-0">
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/12 px-4 py-1.5 text-sm font-medium ring-1 ring-primary-foreground/20">
            <Sparkles className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/85">
            {c.sub}
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
              <Link to={employerHref}>{c.registerFree}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
               className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
              asChild
            >
              <Link to="/contact">{c.learnMore}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="section-label">{c.stepsLabel}</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold">{c.stepsTitle}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {c.steps.map((s, idx) => {
              const Icon = stepIcons[idx]!;
              return (
                <div key={s.title} className="card-lift rounded-lg border border-border bg-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="section-label">{c.whyLabel}</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold">{c.whyTitle}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {c.benefits.map(([t, d]) => (
              <div key={t} className="card-lift rounded-lg border border-border bg-card p-6">
                <h3 className="font-bold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link to={employerHref}>{c.registerNow}</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link to="/contact">{c.learnMore}</Link>
            </Button>
          </div>
        </div>
      </section>

      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <Button className="w-full" size="lg" asChild>
          <Link to={employerHref}>{c.registerFree}</Link>
        </Button>
      </div>
    </>
  );
}
