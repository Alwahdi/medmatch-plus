import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-facilities")({
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
    ],
  }),
  component: ForFacilities,
});

const STEPS = [
  { icon: ClipboardList, title: "١. سجّل منشأتك", text: "أنشئ ملف المنشأة: النوع، المدينة، ونبذة تعريفية." },
  { icon: Users, title: "٢. انشر وظيفة أو مناوبة", text: "حدّد التخصص ونطاق الراتب أو الأجر بالساعة." },
  { icon: ShieldCheck, title: "٣. استقبل كوادر موثّقة", text: "كل متقدم يعرض تخصصه وخبرته وحالة توثيق ترخيصه." },
  { icon: CalendarClock, title: "٤. أدر الفرز حتى التعيين", text: "حرّك الطلب بين المراحل: مراجعة، مقابلة، عرض، تعيين." },
];

function ForFacilities() {
  return (
    <>
      <section className="hero-surface py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">
            غطِّ نقص الكوادر خلال ساعات، لا أسابيع
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">
            SyndeoCare يمنح المستشفيات والعيادات والمجمعات الطبية قناة مباشرة إلى كوادر صحية موثّقة
            — للوظائف الدائمة وللمناوبات العاجلة معاً.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>سجّل منشأتك مجاناً</Link>
          </Button>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-extrabold">كيف تعمل المنصة</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="card-lift rounded-2xl border border-border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="soft-surface py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-extrabold">ما الذي يميّزنا</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["تراخيص موثّقة مسبقاً", "لا تضيّع وقتك في ملاحقة الوثائق: ملف الاعتماد يُراجع قبل التقديم."],
              ["تغطية مناوبات فورية", "انشر المناوبة الليلة، واحصل على حجز خلال دقائق."],
              ["تكلفة أقل من الوساطة", "بدون عمولات وكالات التوظيف التقليدية."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
