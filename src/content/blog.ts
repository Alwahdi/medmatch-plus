export type Bi = { ar: string; en: string };

export type Post = {
  slug: string;
  date: string;
  readMinutes: number;
  category: Bi;
  title: Bi;
  excerpt: Bi;
  sections: { heading: Bi; body: Bi[] }[];
};

export const POSTS: Post[] = [
  {
    slug: "healthcare-hiring-yemen-2026",
    date: "2026-08-20",
    readMinutes: 6,
    category: { ar: "سوق العمل", en: "Job market" },
    title: {
      ar: "سوق التوظيف الصحي في اليمن: أين الطلب الحقيقي؟",
      en: "Healthcare hiring in Yemen: where the real demand is",
    },
    excerpt: {
      ar: "قراءة في التخصصات الأكثر طلباً داخل المستشفيات والعيادات اليمنية وكيف تستعد لها.",
      en: "A look at the most in-demand specialties in Yemeni hospitals and clinics, and how to prepare for them.",
    },
    sections: [
      {
        heading: { ar: "التخصصات الأكثر طلباً", en: "The most in-demand specialties" },
        body: [
          {
            ar: "التمريض والطوارئ والعناية المركزة تتصدر الطلب في المدن الكبرى، تليها الأشعة والمختبرات والصيدلة السريرية.",
            en: "Nursing, emergency and intensive care lead demand in major cities, followed by radiology, laboratories and clinical pharmacy.",
          },
          {
            ar: "العيادات الخاصة تبحث غالباً عن دوام جزئي أو مناوبات، بينما المستشفيات تفضّل التعاقد الدائم.",
            en: "Private clinics often look for part-time or shift cover, while hospitals prefer permanent contracts.",
          },
        ],
      },
      {
        heading: { ar: "كيف تستعد؟", en: "How to prepare" },
        body: [
          {
            ar: "جهّز ترخيصك وشهادات الدورات الإلزامية مسبقاً، فالمنشآت تفضّل من يستطيع المباشرة سريعاً.",
            en: "Prepare your license and mandatory course certificates in advance; facilities prefer candidates who can start quickly.",
          },
          {
            ar: "اجعل ملفك المهني محدثاً وواضح التخصص، لأن معظم الفرز يبدأ من التخصص وسنوات الخبرة.",
            en: "Keep your profile updated with a clear specialty, since most screening starts from specialty and years of experience.",
          },
        ],
      },
    ],
  },
  {
    slug: "shift-work-income",
    date: "2026-08-05",
    readMinutes: 5,
    category: { ar: "المناوبات", en: "Shifts" },
    title: {
      ar: "كيف تبني دخلاً ثابتاً من المناوبات؟",
      en: "How to build steady income from shifts",
    },
    excerpt: {
      ar: "خطوات عملية لاختيار المناوبات المربحة وتنظيم جدولك دون إرهاق.",
      en: "Practical steps to pick profitable shifts and organise your schedule without burnout.",
    },
    sections: [
      {
        heading: { ar: "احسب أجرك الحقيقي", en: "Calculate your real rate" },
        body: [
          {
            ar: "اقسم إجمالي الأجر على الساعات الفعلية شاملاً وقت التنقل، وقارن بين العروض على هذا الأساس.",
            en: "Divide total pay by actual hours including travel time, and compare offers on that basis.",
          },
        ],
      },
      {
        heading: { ar: "حافظ على سمعتك", en: "Protect your reputation" },
        body: [
          {
            ar: "الالتزام بالمواعيد وعدم الإلغاء المتأخر هما أسرع طريق لتكرار الحجز من نفس المنشأة.",
            en: "Punctuality and avoiding late cancellations are the fastest route to repeat bookings from the same facility.",
          },
        ],
      },
    ],
  },
  {
    slug: "interview-red-flags",
    date: "2026-07-18",
    readMinutes: 4,
    category: { ar: "المقابلات", en: "Interviews" },
    title: {
      ar: "خمس إشارات تحذيرية في مقابلة العمل الطبية",
      en: "Five warning signs in a medical job interview",
    },
    excerpt: {
      ar: "علامات تدل على أن العرض قد لا يكون مناسباً لك قبل أن توقّع العقد.",
      en: "Signals that an offer may not suit you, spotted before you sign the contract.",
    },
    sections: [
      {
        heading: { ar: "غموض في الراتب أو الجدول", en: "Vague salary or schedule" },
        body: [
          {
            ar: "إذا لم تحصل على رقم واضح ولا جدول مناوبات مكتوب، اطلبهما كتابياً قبل القبول.",
            en: "If you get no clear figure and no written shift schedule, ask for both in writing before accepting.",
          },
        ],
      },
      {
        heading: { ar: "دوران وظيفي مرتفع", en: "High turnover" },
        body: [
          {
            ar: "اسأل عن مدة بقاء من سبقك في نفس الدور؛ الإجابة تكشف الكثير عن بيئة العمل.",
            en: "Ask how long your predecessor stayed in the role; the answer reveals a lot about the workplace.",
          },
        ],
      },
    ],
  },
  {
    slug: "employer-hiring-speed",
    date: "2026-06-30",
    readMinutes: 5,
    category: { ar: "لناشري الوظائف", en: "For employers" },
    title: {
      ar: "كيف تقلّص زمن التوظيف في منشأتك الصحية؟",
      en: "How to shorten hiring time at your health facility",
    },
    excerpt: {
      ar: "خطوات تجعل إعلانك يجذب المرشح المناسب خلال أيام لا أسابيع.",
      en: "Steps that make your posting attract the right candidate in days, not weeks.",
    },
    sections: [
      {
        heading: { ar: "اكتب إعلاناً محدداً", en: "Write a specific posting" },
        body: [
          {
            ar: "حدّد التخصص وسنوات الخبرة والراتب ونوع الدوام؛ الإعلانات الغامضة تجذب طلبات غير مناسبة.",
            en: "State the specialty, years of experience, salary and work type; vague postings attract unsuitable applications.",
          },
        ],
      },
      {
        heading: { ar: "ردّ خلال ٤٨ ساعة", en: "Respond within 48 hours" },
        body: [
          {
            ar: "المرشح الجيد يستلم أكثر من عرض، والسرعة في الرد غالباً هي الفارق.",
            en: "Strong candidates receive multiple offers, and response speed is usually the deciding factor.",
          },
        ],
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
