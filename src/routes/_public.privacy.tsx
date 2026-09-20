import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { canonical, shareMeta } from "@/lib/seo";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | Privacy Policy | SyndeoCare" },
      {
        name: "description",
        content:
          "كيف تجمع SyndeoCare بياناتك وتستخدمها وتحميها: الملف المهني، وثائق التراخيص، والرسائل داخل المنصة.",
      },
      { property: "og:title", content: "سياسة الخصوصية | Privacy Policy | SyndeoCare" },
      { property: "og:description", content: "تفاصيل جمع البيانات واستخدامها وحقوقك في SyndeoCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      ...shareMeta("/privacy"),
    ],
  links: canonical("/privacy"),
  }),
  component: Privacy,
});

const TXT = {
  ar: {
    badge: "شفافية تامة",
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: سبتمبر ٢٠٢٦",
    contactUs: "تواصل معنا",
    sections: [
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
        h: "٤. ظهورك في بحث المنشآت",
        p: [
          "ظهور ملفك في بحث المرشحين اختياري ومغلق افتراضياً، ولا يُفعَّل إلا بموافقتك الصريحة.",
          "عند تفعيله ترى المنشآت الموثّقة والمشتركة فقط تخصصك وسنوات خبرتك ومدينتك ودولتك وحالة التوثيق وإتاحتك للمناوبات فقط، دون اسمك أو نبذتك أو رقم هاتفك أو بريدك أو وثائقك.",
          "يمكنك إيقافه في أي وقت من ملفك المهني، فتختفي من نتائج البحث الجديدة، وتبقى محادثاتك وطلباتك السابقة متاحة لأطرافها.",
        ],
      },
      {
        h: "٥. وثائق الاعتماد",
        p: [
          "تُحفظ الوثائق في مساحة تخزين خاصة لا يمكن الوصول إليها علناً، ويطّلع عليها فريق المراجعة فقط لغرض التحقق.",
          "يمكنك حذف أي وثيقة من صفحة الاعتمادات في أي وقت.",
        ],
      },
      {
        h: "٦. الرسائل داخل المنصة",
        p: [
          "الرسائل بينك وبين المنشأة مرئية لطرفَي المحادثة فقط، وقد يطّلع عليها فريق الدعم عند بلاغ إساءة.",
        ],
      },
      {
        h: "٧. الاحتفاظ بالبيانات وحقوقك",
        p: [
          "نحتفظ ببياناتك ما دام حسابك نشطاً.",
          "لك الحق في الوصول إلى بياناتك أو تصحيحها، وفي طلب حذف حسابك من الإعدادات (الحساب والخصوصية) أو عبر صفحة التواصل.",
          "طلب الحذف يُراجَع قبل تنفيذه، وقد نحتفظ ببعض السجلات المرتبطة بتعاملات سابقة أو نخفي هويتها بدل حذفها فوراً بالكامل عند الحاجة.",
        ],
      },
      {
        h: "٨. التخزين في المتصفح وملفات الارتباط",
        p: [
          "نستخدم تخزيناً أساسياً في متصفحك (مثل مساحة التخزين المحلية وملفات ارتباط ضرورية) للحفاظ على تسجيل دخولك وجلستك، ولتذكّر لغتك المفضلة.",
          "لا نستخدم إعلانات ولا تتبعاً عبر المواقع الأخرى، ولا نبيع بياناتك.",
        ],
      },
      {
        h: "٩. تحديث السياسة",
        p: ["قد نحدّث هذه السياسة، وتظهر التغييرات مع تحديث تاريخ آخر تعديل، وقد نوضّحها داخل المنصة عند الاقتضاء."],
      },
    ],
  },
  en: {
    badge: "Full transparency",
    title: "Privacy policy",
    lastUpdated: "Last updated: September 2026",
    contactUs: "Contact us",
    sections: [
      {
        h: "1. Data we collect",
        p: [
          "Account data: name, email, phone number, country, and city.",
          "Profile data: specialty, years of experience, bio, expected salary, and license information.",
          "Credential documents you upload for verification.",
          "Usage data: jobs you've browsed, saved, or applied to.",
        ],
      },
      {
        h: "2. How we use your data",
        p: [
          "Displaying your profile to facilities when you apply for a job or shift.",
          "Matching you with relevant opportunities and sending the job alerts you requested.",
          "Verifying your licenses and documents.",
          "Improving the platform and preventing misuse.",
        ],
      },
      {
        h: "3. What we don't do",
        p: [
          "We never sell your personal data to any third party.",
          "We don't share your license documents with facilities; only your verification status is shown.",
          "We don't reveal the posting facility's identity to visitors, nor your full identity before serious contact.",
        ],
      },
      {
        h: "4. Your visibility in facility search",
        p: [
          "Appearing in candidate search is optional and off by default; it is only enabled with your explicit consent.",
          "When enabled, only verified subscribed facilities see your specialty, years of experience, city, country, verification status and shift availability — not your name, bio, phone, email or documents.",
          "You can turn it off at any time from your professional profile; you then drop out of new search results, while your existing conversations and applications remain available to their participants.",
        ],
      },
      {
        h: "5. Credential documents",
        p: [
          "Documents are stored in a private space that isn't publicly accessible, and are only viewed by our review team for verification purposes.",
          "You can delete any document from the credentials page at any time.",
        ],
      },
      {
        h: "6. In-platform messages",
        p: [
          "Messages between you and a facility are visible only to both parties in the conversation, and may be reviewed by our support team when a report of abuse is filed.",
        ],
      },
      {
        h: "7. Data retention and your rights",
        p: [
          "We retain your data as long as your account is active.",
          "You have the right to access and correct your data, and to request account deletion from Settings (Account & privacy) or the contact page.",
          "Deletion requests are reviewed before being carried out, and where necessary some records tied to past transactions may be retained or anonymised rather than erased instantly.",
        ],
      },
      {
        h: "8. Cookies",
        p: ["We use only essential cookies for sign-in and to remember your language preference."],
      },
      {
        h: "9. Policy updates",
        p: ["We may update this policy; changes are reflected with an updated date and may be communicated in-product where appropriate."],
      },
    ],
  },
} as const;

function Privacy() {
  const { lang } = useLang();
  const c = TXT[lang];
  return (
    <>
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <ShieldCheck className="size-4" />
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
