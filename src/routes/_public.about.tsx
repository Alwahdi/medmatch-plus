import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, ShieldCheck, Sparkles, Users, ArrowLeft, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "من نحن | About SyndeoCare — Arabic healthcare hiring" },
      {
        name: "description",
        content:
          "SyndeoCare منصة عربية تربط الكوادر الصحية بالمنشآت: وظائف دائمة، مناوبات فورية، وتوثيق تراخيص موحّد.",
      },
      { property: "og:title", content: "من نحن | SyndeoCare" },
      { property: "og:description", content: "رسالتنا: توظيف صحي أسرع وأكثر شفافية في العالم العربي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const TXT = {
  ar: {
    badge: "منصة عربية للتوظيف الطبي",
    title: "من نحن",
    sub: "SyndeoCare منصة توظيف متخصصة في القطاع الصحي بالعالم العربي، تجمع الوظائف الدائمة والمناوبات الفورية وتوثيق التراخيص في مكان واحد.",
    whyLabel: "لماذا بدأنا",
    whyTitle: "نقص الكوادر يستحق حلاً أسرع",
    why1: "الكادر الصحي يقضي أسابيع في إرسال سير ذاتية دون رد، والمنشأة تقضي أسابيع أخرى في التحقق من وثائق كل متقدم. النتيجة: أقسام تعمل بنقص، وكفاءات تنتظر بلا سبب.",
    why2: "بنينا SyndeoCare لتقصير هذه الدورة: ملف مهني واحد بوثائق تُراجع مرة واحدة ويُستخدم في كل طلب، وإعلانات واضحة النطاق المالي، وقناة تواصل مباشرة داخل المنصة بلا وسطاء.",
    createAccount: "إنشاء حساب",
    contactUs: "تواصل معنا",
    valuesLabel: "قيمنا",
    values: [
      { title: "الثقة أولاً", text: "نراجع التراخيص والوثائق المرفوعة، وشارة «موثّق» تعني اعتماداً فعلياً من فريقنا." },
      { title: "خصوصية الطرفين", text: "هوية المنشأة لا تُكشف إلا عند التواصل الجاد أو قبول الطلب." },
      { title: "شفافية الأجر", text: "كل إعلان يعرض نطاق الراتب أو الأجر بالساعة بوضوح." },
      { title: "سرعة التغطية", text: "المناوبة العاجلة تُنشر وتُحجز خلال ساعات، لا أسابيع." },
    ],
    readyTitle: "جاهز تبدأ؟",
    readyText: "التسجيل مجاني للكوادر الصحية، وللمنشآت تجربة ٣٠ يوماً بلا التزام.",
  },
  en: {
    badge: "An Arab healthcare hiring platform",
    title: "About us",
    sub: "SyndeoCare is a hiring platform dedicated to the healthcare sector across the Arab world, bringing permanent jobs, instant shifts, and license verification into one place.",
    whyLabel: "Why we started",
    whyTitle: "Staffing shortages deserve a faster solution",
    why1: "Healthcare professionals spend weeks sending CVs with no response, while facilities spend more weeks verifying every applicant's documents. The result: understaffed departments and qualified talent left waiting for no good reason.",
    why2: "We built SyndeoCare to shorten this cycle: one professional profile whose documents are reviewed once and reused for every application, listings with clear pay ranges, and a direct in-platform communication channel with no middlemen.",
    createAccount: "Create an account",
    contactUs: "Contact us",
    valuesLabel: "Our values",
    values: [
      { title: "Trust first", text: "We review uploaded licenses and documents, and the “verified” badge means an actual approval by our team." },
      { title: "Privacy for both sides", text: "The facility's identity isn't revealed until serious contact or an accepted application." },
      { title: "Pay transparency", text: "Every listing clearly shows the salary range or hourly pay." },
      { title: "Fast coverage", text: "Urgent shifts get posted and booked within hours, not weeks." },
    ],
    readyTitle: "Ready to get started?",
    readyText: "Sign-up is free for healthcare professionals, and facilities get a 30-day trial with no commitment.",
  },
} as const;

function About() {
  const { lang } = useLang();
  const c = TXT[lang];
  const icons: LucideIcon[] = [ShieldCheck, Users, Sparkles, HeartPulse];
  const VALUES = c.values.map((v, i) => ({ ...v, icon: icons[i]! }));

  return (
    <>
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <Sparkles className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-on-hero/85">
            {c.sub}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="section-label">{c.whyLabel}</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold">{c.whyTitle}</h2>
              <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground">
                <p>{c.why1}</p>
                <p>{c.why2}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/register">{c.createAccount}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">{c.contactUs}</Link>
                </Button>
              </div>
            </div>

            <div className="card-lift rounded-lg border border-border bg-card p-8">
              <p className="section-label">{c.valuesLabel}</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {VALUES.map((v) => (
                  <div key={v.title}>
                    <span className="flex size-11 items-center justify-center rounded-lg bg-accent/12 text-accent">
                      <v.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-bold">{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-lg border border-border bg-surface p-8 text-center">
            <h2 className="font-display text-2xl font-extrabold">{c.readyTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {c.readyText}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/register">{c.createAccount}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/contact">{c.contactUs}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
