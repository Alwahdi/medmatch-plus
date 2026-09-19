import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

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
    ],
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
        h: "4. Credential documents",
        p: [
          "Documents are stored in a private space that isn't publicly accessible, and are only viewed by our review team for verification purposes.",
          "You can delete any document from the credentials page at any time.",
        ],
      },
      {
        h: "5. In-platform messages",
        p: [
          "Messages between you and a facility are visible only to both parties in the conversation, and may be reviewed by our support team when a report of abuse is filed.",
        ],
      },
      {
        h: "6. Data retention and your rights",
        p: [
          "We retain your data as long as your account is active.",
          "You have the right to access, correct, or request full deletion of your account via the contact page.",
        ],
      },
      {
        h: "7. Cookies",
        p: ["We use only essential cookies for sign-in and to remember your language preference."],
      },
      {
        h: "8. Policy updates",
        p: ["We may update this policy, and we'll notify you within the platform of any material change."],
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
