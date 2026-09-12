import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام | SyndeoCare" },
      {
        name: "description",
        content:
          "شروط استخدام منصة SyndeoCare للكوادر الصحية والمنشآت: الحساب، الإعلانات، الاشتراكات، والسلوك المقبول.",
      },
      { property: "og:title", content: "شروط الاستخدام | SyndeoCare" },
      { property: "og:description", content: "الشروط المنظّمة لاستخدام منصة SyndeoCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "١. قبول الشروط",
    p: ["باستخدامك SyndeoCare فإنك توافق على هذه الشروط. إن لم توافق عليها، يرجى عدم استخدام المنصة."],
  },
  {
    h: "٢. الحساب",
    p: [
      "يجب أن تكون البيانات التي تقدّمها صحيحة وحديثة.",
      "أنت مسؤول عن سرية بيانات دخولك وعن كل نشاط يتم عبر حسابك.",
      "يحق لنا تعليق أي حساب يقدّم وثائق مزوّرة أو بيانات مضللة.",
    ],
  },
  {
    h: "٣. الكوادر الصحية",
    p: [
      "استخدام المنصة مجاني للكوادر الصحية.",
      "الوثائق المرفوعة يجب أن تخصّك أنت شخصياً وتكون سارية.",
      "التقديم على وظيفة لا يضمن القبول، والقرار النهائي للمنشأة.",
    ],
  },
  {
    h: "٤. المنشآت",
    p: [
      "الإعلانات يجب أن تكون لوظائف حقيقية مع نطاق أجر واضح.",
      "يُمنع طلب أي رسوم من المتقدمين تحت أي مسمّى.",
      "بيانات المرشحين تُستخدم لغرض التوظيف فقط، ويُمنع مشاركتها خارج المنشأة.",
    ],
  },
  {
    h: "٥. الاشتراكات",
    p: [
      "تحصل المنشأة على تجربة مجانية ٣٠ يوماً تبدأ عند إنشاء ملف المنشأة.",
      "بعد انتهاء التجربة أو بلوغ حدود الباقة تتوقف إمكانية نشر إعلانات جديدة حتى الترقية.",
      "حدود كل باقة (الوظائف، المناوبات، الإعلانات المميزة، عمليات البحث عن المرشحين) موضّحة في صفحة الأسعار.",
    ],
  },
  {
    h: "٦. السلوك المقبول",
    p: [
      "يُمنع التحرش أو التمييز أو الرسائل التجارية غير المرغوبة داخل المنصة.",
      "يُمنع محاولة استخراج البيانات آلياً أو تجاوز حدود الباقة بأي وسيلة.",
    ],
  },
  {
    h: "٧. حدود المسؤولية",
    p: [
      "SyndeoCare وسيط تقني ولا يكون طرفاً في عقد العمل بين الكادر والمنشأة.",
      "لا نضمن الحصول على وظيفة أو تعبئة شاغر، ولا نتحمل مسؤولية اتفاقات تتم خارج المنصة.",
    ],
  },
  {
    h: "٨. إنهاء الخدمة",
    p: ["يمكنك حذف حسابك في أي وقت، ويحق لنا إنهاء الخدمة عند مخالفة هذه الشروط."],
  },
];

function Terms() {
  return (
    <>
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <FileText className="size-4" />
            الاستخدام المسؤول
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">شروط الاستخدام</h1>
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
