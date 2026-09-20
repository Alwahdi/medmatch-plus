import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام | Terms of Use | SyndeoCare" },
      {
        name: "description",
        content:
          "شروط استخدام منصة SyndeoCare للكوادر الصحية والمنشآت: الحساب، الإعلانات، والالتزام المهني.",
      },
      { property: "og:title", content: "شروط الاستخدام | Terms of Use | SyndeoCare" },
      { property: "og:description", content: "الشروط المنظّمة لاستخدام منصة SyndeoCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

const TXT = {
  ar: {
    badge: "الاستخدام المسؤول",
    title: "شروط الاستخدام",
    lastUpdated: "آخر تحديث: سبتمبر ٢٠٢٦",
    contactUs: "تواصل معنا",
    sections: [
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
        h: "٥. النسخة التجريبية",
        p: [
          "تعمل المنصة حالياً كنسخة إطلاق تجريبية مجانية دون بوابة دفع.",
          "قد تطبق حدود استخدام عادلة على النشر والبحث لحماية جودة الخدمة، وتظهر هذه الحدود داخل حساب المنشأة.",
          "سيتم توضيح أي تغيير مستقبلي قبل تطبيقه، ولن تُطلب بيانات دفع خلال النسخة التجريبية الحالية.",
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
        p: [
          "يمكنك طلب حذف حسابك في أي وقت من الإعدادات أو عبر صفحة التواصل، ويُراجَع الطلب قبل تنفيذه.",
          "قد نحتاج للاحتفاظ ببعض السجلات أو إخفاء هويتها لفترة محدودة لأسباب أمنية أو تنظيمية أو لسلامة سجل التعاملات.",
          "يحق لنا إنهاء الخدمة عند مخالفة هذه الشروط.",
        ],
      },
    ],
  },
  en: {
    badge: "Responsible use",
    title: "Terms of use",
    lastUpdated: "Last updated: September 2026",
    contactUs: "Contact us",
    sections: [
      {
        h: "1. Acceptance of terms",
        p: ["By using SyndeoCare you agree to these terms. If you don't agree, please don't use the platform."],
      },
      {
        h: "2. Your account",
        p: [
          "The information you provide must be accurate and up to date.",
          "You're responsible for keeping your login credentials confidential and for all activity on your account.",
          "We reserve the right to suspend any account that submits forged documents or misleading information.",
        ],
      },
      {
        h: "3. Healthcare professionals",
        p: [
          "Using the platform is free for healthcare professionals.",
          "Uploaded documents must belong to you personally and be currently valid.",
          "Applying to a job doesn't guarantee acceptance; the final decision rests with the facility.",
        ],
      },
      {
        h: "4. Facilities",
        p: [
          "Listings must be for real positions with a clear pay range.",
          "Charging applicants any fee, under any name, is prohibited.",
          "Candidate data may only be used for hiring purposes and must not be shared outside the facility.",
        ],
      },
      {
        h: "5. Trial release",
        p: [
          "The platform currently operates as a free trial release with no payment gateway.",
          "Fair-use limits may apply to posting and talent search to protect service quality, and appear inside the facility account.",
          "Any future change will be explained before it takes effect, and no payment details are requested during the current trial.",
        ],
      },
      {
        h: "6. Acceptable conduct",
        p: [
          "Harassment, discrimination, or unsolicited commercial messages within the platform are prohibited.",
          "Automated data scraping or bypassing plan limits by any means is prohibited.",
        ],
      },
      {
        h: "7. Limitation of liability",
        p: [
          "SyndeoCare is a technology intermediary and is not a party to the employment contract between a professional and a facility.",
          "We don't guarantee that you'll get hired or fill a vacancy, and we aren't liable for agreements made outside the platform.",
        ],
      },
      {
        h: "8. Termination",
        p: [
          "You may request account deletion at any time from Settings or the contact page; requests are reviewed before they are carried out.",
          "Some records may need to be retained or anonymised for a limited period for security, regulatory, or transaction-integrity reasons.",
          "We reserve the right to terminate service for violations of these terms.",
        ],
      },
    ],
  },
} as const;

function Terms() {
  const { lang } = useLang();
  const c = TXT[lang];
  return (
    <>
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <FileText className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-on-hero/85">
            {c.lastUpdated}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="space-y-8">
            {c.sections.map((s) => (
              <div key={s.h} className="card-lift rounded-lg border border-border bg-card p-6">
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
              <Link to="/contact">{c.contactUs} <ArrowLeft className="size-4 ltr:rotate-180" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
