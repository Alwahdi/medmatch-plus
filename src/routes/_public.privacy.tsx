import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | SyndeoCare" },
      {
        name: "description",
        content:
          "كيف تجمع SyndeoCare بياناتك وتستخدمها وتحميها: الملف المهني، وثائق التراخيص، والرسائل داخل المنصة.",
      },
      { property: "og:title", content: "سياسة الخصوصية | SyndeoCare" },
      { property: "og:description", content: "تفاصيل جمع البيانات واستخدامها وحقوقك في SyndeoCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "١. البيانات التي نجمعها",
    p: [
      "بيانات الحساب: الاسم، البريد الإلكتروني، رقم الجوال، الدولة والمدينة.",
      "بيانات الملف المهني: التخصص، سنوات الخبرة، النبذة، الراتب المتوقع، وبيانات الترخيص.",
      "وثائق الاعتماد التي ترفعها لغرض التوثيق.",
      "بيانات الاستخدام: الوظائف التي تصفحتها أو حفظتها أو تقدمت لها.",
    ],
  },
  {
    h: "٢. كيف نستخدم البيانات",
    p: [
      "عرض ملفك على المنشآت عند تقدمك لوظيفة أو مناوبة.",
      "مطابقتك مع الفرص المناسبة وإرسال تنبيهات الوظائف التي طلبتها.",
      "التحقق من صحة تراخيصك ووثائقك.",
      "تحسين المنصة ومنع إساءة الاستخدام.",
    ],
  },
  {
    h: "٣. ما لا نفعله",
    p: [
      "لا نبيع بياناتك الشخصية لأي طرف ثالث.",
      "لا نشارك وثائق تراخيصك مع المنشآت؛ تُعرض حالة التوثيق فقط.",
      "لا نكشف هوية المنشأة الناشرة للزوار، ولا هويتك الكاملة قبل تواصل جاد.",
    ],
  },
  {
    h: "٤. وثائق الاعتماد",
    p: [
      "تُحفظ الوثائق في مساحة تخزين خاصة لا يمكن الوصول إليها علناً، ويطّلع عليها فريق المراجعة فقط لغرض التحقق.",
      "يمكنك حذف أي وثيقة من صفحة الاعتمادات في أي وقت.",
    ],
  },
  {
    h: "٥. الرسائل داخل المنصة",
    p: [
      "الرسائل بينك وبين المنشأة مرئية لطرفَي المحادثة فقط، وقد يطّلع عليها فريق الدعم عند بلاغ إساءة.",
    ],
  },
  {
    h: "٦. الاحتفاظ بالبيانات وحقوقك",
    p: [
      "نحتفظ ببياناتك ما دام حسابك نشطاً.",
      "لك الحق في الوصول إلى بياناتك أو تصحيحها أو طلب حذف حسابك بالكامل عبر صفحة التواصل.",
    ],
  },
  {
    h: "٧. ملفات الارتباط",
    p: ["نستخدم ملفات ارتباط أساسية لتسجيل الدخول وحفظ تفضيلات اللغة فقط."],
  },
  {
    h: "٨. تحديث السياسة",
    p: ["قد نحدّث هذه السياسة، وسننبّهك داخل المنصة عند أي تغيير جوهري."],
  },
];

function Privacy() {
  return (
    <>
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <ShieldCheck className="size-4" />
            شفافية تامة
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">سياسة الخصوصية</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            آخر تحديث: سبتمبر ٢٠٢٦
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.h} className="card-lift rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-bold">{s.h}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {s.p.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link to="/contact">تواصل معنا <ArrowLeft className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
