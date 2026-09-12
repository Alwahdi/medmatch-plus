import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, ShieldCheck, Sparkles, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "من نحن | SyndeoCare — منصة التوظيف الطبي العربية" },
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

const VALUES = [
  { icon: ShieldCheck, title: "الثقة أولاً", text: "نراجع التراخيص والوثائق قبل ظهور الملف للمنشآت." },
  { icon: Users, title: "خصوصية الطرفين", text: "هوية المنشأة لا تُكشف إلا عند التواصل الجاد أو قبول الطلب." },
  { icon: Sparkles, title: "شفافية الأجر", text: "كل إعلان يعرض نطاق الراتب أو الأجر بالساعة بوضوح." },
  { icon: HeartPulse, title: "سرعة التغطية", text: "المناوبة العاجلة تُنشر وتُحجز خلال ساعات، لا أسابيع." },
];

function About() {
  return (
    <>
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <Sparkles className="size-4" />
            منصة عربية للتوظيف الطبي
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">من نحن</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">
            SyndeoCare منصة توظيف متخصصة في القطاع الصحي بالعالم العربي، تجمع الوظائف الدائمة
            والمناوبات الفورية وتوثيق التراخيص في مكان واحد.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="section-label">لماذا بدأنا</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold">نقص الكوادر يستحق حلاً أسرع</h2>
              <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  الكادر الصحي يقضي أسابيع في إرسال سير ذاتية دون رد، والمنشأة تقضي أسابيع أخرى في
                  التحقق من وثائق كل متقدم. النتيجة: أقسام تعمل بنقص، وكفاءات تنتظر بلا سبب.
                </p>
                <p>
                  بنينا SyndeoCare لتقصير هذه الدورة: ملف مهني موثّق مرة واحدة يُستخدم في كل طلب،
                  وإعلانات واضحة النطاق المالي، وقناة تواصل مباشرة داخل المنصة بلا وسطاء.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/register">إنشاء حساب</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">تواصل معنا</Link>
                </Button>
              </div>
            </div>

            <div className="card-lift rounded-3xl border border-border bg-card p-8">
              <p className="section-label">قيمنا</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {VALUES.map((v) => (
                  <div key={v.title}>
                    <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
                      <v.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-bold">{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="font-display text-2xl font-extrabold">جاهز تبدأ؟</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              التسجيل مجاني للكوادر الصحية، وللمنشآت تجربة ٣٠ يوماً بلا التزام.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/register">إنشاء حساب</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/contact">تواصل معنا</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
