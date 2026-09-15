/**
 * قاموس المصطلحات الموحّد — مصدر واحد لكل كلمة تظهر للمستخدم.
 *
 * القواعد الثابتة:
 * - «وظيفة» = توظيف دائم. «مناوبة» = عمل مؤقت بالساعة.
 * - «فرصة» = المظلة التي تجمعهما (سوق الفرص، أو حين يكون النوع غير محدد).
 * - كلمة «إعلان» ممنوعة في واجهة المستخدم.
 * - «متقدم» = من قدّم فعلاً على وظيفة. «مرشح» = من تبحث عنه المنشأة ولم يقدّم.
 */
export const TERMS = {
  ar: {
    job: "وظيفة",
    jobs: "الوظائف",
    shift: "مناوبة",
    shifts: "المناوبات",
    opportunity: "فرصة",
    opportunityDef: "الفرصة",
    opportunities: "الفرص",
    myOpportunities: "فرصي المنشورة",
    applicant: "متقدم",
    applicants: "المتقدمون",
    candidate: "مرشح",
    candidates: "المرشحون",
    booking: "حجز",
    bookings: "الحجوزات",
    professional: "مختص",
    facility: "منشأة",
    viewOpportunity: "عرض الفرصة",
  },
  en: {
    job: "job",
    jobs: "Jobs",
    shift: "shift",
    shifts: "Shifts",
    opportunity: "opportunity",
    opportunityDef: "the opportunity",
    opportunities: "Opportunities",
    myOpportunities: "My published opportunities",
    applicant: "applicant",
    applicants: "Applicants",
    candidate: "candidate",
    candidates: "Candidates",
    booking: "booking",
    bookings: "Bookings",
    professional: "professional",
    facility: "facility",
    viewOpportunity: "View opportunity",
  },
} as const;

export type Lang = keyof typeof TERMS;

/** كلمة النوع الصحيحة حسب نوع العمل المنشور. */
export function workTypeWord(kind: "job" | "shift", lang: Lang) {
  return kind === "shift" ? TERMS[lang].shift : TERMS[lang].job;
}
