import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

const STORAGE_KEY = "syndeocare-lang";

type Dict = Record<string, { ar: string; en: string }>;

export const DICT: Dict = {
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.jobs": { ar: "الوظائف", en: "Jobs" },
  "nav.shifts": { ar: "الشيفتات", en: "Shifts" },
  "nav.guides": { ar: "الأدلة", en: "Guides" },
  "nav.questions": { ar: "بنوك الأسئلة", en: "Question banks" },
  "nav.about": { ar: "من نحن", en: "About" },
  "nav.contact": { ar: "اتصل بنا", en: "Contact" },
  "nav.postJob": { ar: "انشر وظيفة", en: "Post a job" },
  "nav.specialties": { ar: "التخصصات", en: "Specialties" },
  "nav.forFacilities": { ar: "للمنشآت", en: "For facilities" },
  "nav.pricing": { ar: "الأسعار", en: "Pricing" },
  "nav.account": { ar: "حسابي", en: "Account" },
  "nav.dashboard": { ar: "لوحتي", en: "Dashboard" },
  "nav.messages": { ar: "الرسائل", en: "Messages" },
  "nav.candidates": { ar: "بحث المرشحين", en: "Candidate search" },
  "nav.profile": { ar: "ملفي المهني", en: "My profile" },
  "nav.credentials": { ar: "ملف الاعتماد", en: "Credentials" },
  "nav.applications": { ar: "طلباتي", en: "My applications" },
  "nav.cv": { ar: "سيرتي الذاتية", en: "My CV" },
  "nav.cvImport": { ar: "بناء الملف من السيرة", en: "Build profile from CV" },
  "nav.saved": { ar: "الوظائف المحفوظة", en: "Saved jobs" },
  "nav.alerts": { ar: "تنبيهات الوظائف", en: "Job alerts" },
  "nav.admin": { ar: "لوحة الإدارة", en: "Admin" },
  "nav.signOut": { ar: "تسجيل الخروج", en: "Sign out" },
  "nav.signIn": { ar: "تسجيل الدخول", en: "Sign in" },
  "nav.signUp": { ar: "إنشاء حساب", en: "Sign up" },
  "nav.menu": { ar: "القائمة", en: "Menu" },
  "lang.switch": { ar: "English", en: "العربية" },
  "lang.label": { ar: "تغيير اللغة", en: "Change language" },

  "footer.tagline": {
    ar: "منصة عربية تربط الكوادر الصحية بالمستشفيات والعيادات: وظائف دائمة، مناوبات فورية، وتوثيق تراخيص موحّد.",
    en: "An Arabic-first platform connecting healthcare professionals with hospitals and clinics: permanent jobs, instant shifts, and unified license verification.",
  },
  "footer.forPros": { ar: "للكوادر الصحية", en: "For professionals" },
  "footer.browseJobs": { ar: "تصفح الوظائف", en: "Browse jobs" },
  "footer.shiftMarket": { ar: "سوق المناوبات", en: "Shift marketplace" },
  "footer.createProfile": { ar: "إنشاء ملف مهني", en: "Create a profile" },
  "footer.forFacilities": { ar: "للمنشآت", en: "For facilities" },
  "footer.howItWorks": { ar: "كيف تعمل المنصة", en: "How it works" },
  "footer.plans": { ar: "الأسعار والباقات", en: "Plans & pricing" },
  "footer.registerFacility": { ar: "تسجيل منشأة", en: "Register a facility" },
  "footer.resources": { ar: "المصادر", en: "Resources" },
  "footer.guides": { ar: "الأدلة والمقالات", en: "Guides & articles" },
  "footer.questions": { ar: "أسئلة المقابلات", en: "Interview questions" },
  "footer.specialties": { ar: "التخصصات", en: "Specialties" },
  "footer.platform": { ar: "المنصة", en: "Platform" },
  "footer.about": { ar: "من نحن", en: "About us" },
  "footer.contact": { ar: "تواصل معنا", en: "Contact us" },
  "footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy policy" },
  "footer.terms": { ar: "شروط الاستخدام", en: "Terms of use" },
  "footer.rights": { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },

  "home.metaTitle": {
    ar: "SyndeoCare | وظائف وشيفتات طبية موثوقة في العالم العربي",
    en: "SyndeoCare | Trusted medical jobs & shifts across the Arab world",
  },
  "home.metaDescription": {
    ar: "كل الكفاءات الطبية التي تحتاجها — أطباء، صيادلة، تمريض، وفنيون — في مكان واحد. وظائف دائمة، شيفتات فورية، وناشرو وظائف موثّقون.",
    en: "All the medical talent you need — doctors, pharmacists, nurses, and technicians — in one place. Permanent jobs, instant shifts, verified employers.",
  },
  "home.hero.badge": { ar: "منصة عربية للتوظيف الطبي", en: "Arab healthcare hiring platform" },
  "home.hero.title": { ar: "نبني مستقبل التوظيف الطبي", en: "Building the future of medical hiring" },
  "home.hero.subtitle": {
    ar: "كل الكفاءات الطبية التي تحتاجها — أطباء، صيادلة، تمريض، وفنيون — في مكان واحد.",
    en: "All the medical talent you need — doctors, pharmacists, nurses, and technicians — in one place.",
  },
  "home.hero.ctaEmployers": { ar: "ابدأ التوظيف", en: "Start hiring" },
  "home.hero.ctaSeekers": { ar: "تصفّح الوظائف", en: "Browse jobs" },
  "home.search.placeholderRole": { ar: "المسمى الوظيفي، الكلمة المفتاحية، أو التخصص", en: "Job title, keyword, or specialty" },
  "home.search.placeholderLoc": { ar: "المدينة أو الموقع", en: "City or location" },
  "home.search.button": { ar: "تصفّح الوظائف", en: "Browse jobs" },
  "home.why.label": { ar: "لماذا SyndeoCare", en: "Why SyndeoCare" },
  "home.why.verified.title": { ar: "ناشرو الوظائف موثّقون", en: "Verified employers" },
  "home.why.verified.text": {
    ar: "كل مستشفى وعيادة ومعمل وصيدلية تم التحقق من اعتماداتها قبل النشر.",
    en: "Every hospital, clinic, lab, and pharmacy is verified before posting.",
  },
  "home.why.oneclick.title": { ar: "قدّم بنقرة واحدة", en: "One-click apply" },
  "home.why.oneclick.text": {
    ar: "أرسل ملفك الطبي فوراً — بدون نماذج طويلة ولا خطابات تعريف.",
    en: "Submit your medical profile instantly — no long forms or cover letters.",
  },
  "home.why.arab.title": { ar: "مصمّم للمنطقة العربية", en: "Built for the Arab world" },
  "home.why.arab.text": {
    ar: "مبنيّ لأسواق الرعاية الصحية في السعودية والإمارات ومصر وباقي دول الخليج.",
    en: "Built for healthcare markets in Saudi Arabia, UAE, Egypt, and the rest of the Gulf.",
  },
  "home.why.free.title": { ar: "مجانية للباحثين عن عمل", en: "Free for job seekers" },
  "home.why.free.text": {
    ar: "بدون رسوم أبداً — للأطباء والتمريض والصيادلة والفنيين.",
    en: "No fees ever — for doctors, nurses, pharmacists, and technicians.",
  },
  "home.sides.title": { ar: "مصمّم لطرفَي الرعاية الصحية", en: "Built for both sides of healthcare" },
  "home.sides.pros.label": { ar: "للباحثين عن عمل", en: "For job seekers" },
  "home.sides.pros.title": { ar: "اعثر على شيفتك أو وظيفتك القادمة", en: "Find your next shift or job" },
  "home.sides.pros.text": {
    ar: "ارفع سيرتك الذاتية ويبني الذكاء الاصطناعي ملفك في ثوانٍ، ثم تصفّح وظائف وشيفتات موثوقة لدى ناشري وظائف طبية معتمدين وتقدّم فوراً.",
    en: "Upload your CV and AI builds your profile in seconds, then browse verified medical jobs and shifts and apply instantly.",
  },
  "home.sides.pros.cta": { ar: "تصفّح الوظائف", en: "Browse jobs" },
  "home.sides.employers.label": { ar: "لناشري الوظائف", en: "For employers" },
  "home.sides.employers.title": { ar: "وظّف كوادر موثوقة بسرعة", en: "Hire verified staff fast" },
  "home.sides.employers.text": {
    ar: "انشر وظيفة أو شيفتاً، واستلم تنبيهاً فور تقدّم كادر مؤهّل — فلا يفوتك أي مرشّح مناسب.",
    en: "Post a job or shift and get notified the moment a qualified candidate applies — never miss a match.",
  },
  "home.sides.employers.cta": { ar: "انشر وظيفة", en: "Post a job" },
  "home.steps.label": { ar: "كيف تعمل المنصة", en: "How it works" },
  "home.steps.title": {
    ar: "من الاستكشاف إلى التوظيف في أربع خطوات واضحة",
    en: "From discovery to hire in four clear steps",
  },
  "home.steps.subtitle": { ar: "تجربة متكاملة لكلا طرفي رحلة التوظيف الصحي.", en: "A complete experience for both sides of healthcare hiring." },
  "home.steps.tabEmployers": { ar: "لناشري الوظائف", en: "For employers" },
  "home.steps.tabSeekers": { ar: "للباحثين عن عمل", en: "For job seekers" },
  "home.steps.employer1.title": { ar: "انشر وظيفة أو شيفت", en: "Post a job or shift" },
  "home.steps.employer1.text": {
    ar: "انشر وظيفة دائمة أو شيفتاً عاجلاً خلال دقائق — ليظهر فوراً للكوادر الموثّقة.",
    en: "Post a permanent job or urgent shift in minutes — instantly visible to verified candidates.",
  },
  "home.steps.employer2.title": { ar: "استقبل الطلبات", en: "Receive applications" },
  "home.steps.employer2.text": {
    ar: "الكوادر المؤهّلة، بعد تدقيق تراخيصها، تبدأ بالتقديم خلال دقائق من النشر.",
    en: "Qualified candidates, after license verification, start applying within minutes of posting.",
  },
  "home.steps.employer3.title": { ar: "تنبيهات فورية عند كل طلب", en: "Instant application alerts" },
  "home.steps.employer3.text": {
    ar: "يصلك تنبيه لحظة تقدّم أي مرشّح — دون الحاجة لمتابعة لوحة التحكم.",
    en: "Get notified the moment any candidate applies — no need to keep checking the dashboard.",
  },
  "home.steps.employer3.highlight": { ar: "ميزة SyndeoCare", en: "SyndeoCare feature" },
  "home.steps.employer4.title": { ar: "راجع المرشحين ووظّف", en: "Review and hire" },
  "home.steps.employer4.text": {
    ar: "افتح الطلب مباشرة، قارن الملفات، راسل المرشّح، وأكّد التعيين.",
    en: "Open applications, compare profiles, message candidates, and confirm the hire.",
  },
  "home.steps.employerCta": { ar: "ابدأ التوظيف", en: "Start hiring" },
  "home.steps.seeker1.title": { ar: "ارفع سيرتك الذاتية", en: "Upload your CV" },
  "home.steps.seeker1.text": {
    ar: "يبني الذكاء الاصطناعي ملفك المهني في ثوانٍ بدل ملء النماذج الطويلة.",
    en: "AI builds your professional profile in seconds instead of filling long forms.",
  },
  "home.steps.seeker2.title": { ar: "وثّق ترخيصك مرة واحدة", en: "Verify your license once" },
  "home.steps.seeker2.text": {
    ar: "ارفع الترخيص والشهادات، ونراجعها لتظهر كـ«كادر موثّق» في كل تقديم.",
    en: "Upload your license and certificates for review so you appear as a verified candidate on every application.",
  },
  "home.steps.seeker2.highlight": { ar: "ميزة SyndeoCare", en: "SyndeoCare feature" },
  "home.steps.seeker3.title": { ar: "تصفّح وقدّم بنقرة", en: "Browse and apply in one click" },
  "home.steps.seeker3.text": {
    ar: "وظائف دائمة وشيفتات فورية بأجر معلن لدى ناشري وظائف موثّقين.",
    en: "Permanent jobs and instant shifts with published pay from verified employers.",
  },
  "home.steps.seeker4.title": { ar: "تابع طلبك حتى التعيين", en: "Track until hired" },
  "home.steps.seeker4.text": {
    ar: "تتبّع مراحل الطلب وراسل جهة التوظيف مباشرة من داخل المنصة.",
    en: "Track application stages and message the employer directly inside the platform.",
  },
  "home.steps.seekerCta": { ar: "أنشئ ملفك المهني", en: "Create your profile" },
  "home.ai.label": { ar: "تأهيل مدعوم بالذكاء الاصطناعي", en: "AI-powered onboarding" },
  "home.ai.title": {
    ar: "ارفع سيرتك الذاتية، ودع الذكاء الاصطناعي يبني ملفّك في ثوانٍ",
    en: "Upload your CV and let AI build your profile in seconds",
  },
  "home.ai.text": {
    ar: "لا مزيد من ملء النماذج الطويلة. ارفع سيرتك مرة واحدة ويحوّلها ذكاء SyndeoCare الاصطناعي إلى ملف مهني متكامل — لتبدأ التقديم على الوظائف والشيفتات خلال دقائق لا ساعات.",
    en: "No more long forms. Upload your CV once and SyndeoCare AI turns it into a complete professional profile — start applying to jobs and shifts in minutes, not hours.",
  },
  "home.ai.forPros": { ar: "للباحثين عن عمل", en: "For job seekers" },
  "home.ai.pros1": { ar: "سجّل في أقل من دقيقة — دون نماذج طويلة", en: "Sign up in under a minute — no long forms" },
  "home.ai.pros2": { ar: "ملف متكامل واحترافي يلفت الأنظار", en: "A complete, professional profile that stands out" },
  "home.ai.pros3": { ar: "مطابقة أدقّ مع الوظائف والشيفتات المناسبة", en: "Better matching with the right jobs and shifts" },
  "home.ai.forEmployers": { ar: "لناشري الوظائف", en: "For employers" },
  "home.ai.emp1": { ar: "ملفات مرشّحين أكثر اكتمالاً وثراءً", en: "Richer, more complete candidate profiles" },
  "home.ai.emp2": { ar: "مطابقة أفضل مع شواغرك المفتوحة", en: "Better fit for your open roles" },
  "home.ai.emp3": { ar: "طلبات بجودة أعلى وتواصل أقل", en: "Higher quality applications, less back-and-forth" },
  "home.ai.languages": { ar: "يدعم السير الذاتية بالعربية والإنجليزية", en: "Supports CVs in Arabic and English" },
  "home.ai.ctaPrimary": { ar: "أنشئ ملفك في ثوانٍ", en: "Build your profile in seconds" },
  "home.ai.ctaSecondary": { ar: "تصفّح الوظائف أولاً", en: "Browse jobs first" },
  "home.ai.uploading": { ar: "جارٍ تحليل السيرة الذاتية…", en: "Analyzing your CV…" },
  "home.ai.rows.specialty": { ar: "التخصص وسنوات الخبرة", en: "Specialty and years of experience" },
  "home.ai.rows.license": { ar: "الترخيص المهني والدولة", en: "Professional license and country" },
  "home.ai.rows.skills": { ar: "المهارات السريرية والملخص المهني", en: "Clinical skills and summary" },
  "home.ai.rows.experience": { ar: "جهات العمل السابقة", en: "Previous employers" },
  "home.jobs.label": { ar: "وظائف دائمة", en: "Permanent jobs" },
  "home.jobs.title": { ar: "أحدث الوظائف الطبية", en: "Latest medical jobs" },
  "home.jobs.subtitle": {
    ar: "فرص جديدة منشورة من مستشفيات وعيادات ومنشآت متخصصة موثّقة.",
    en: "New opportunities posted by verified hospitals, clinics, and specialized facilities.",
  },
  "home.jobs.cta": { ar: "عرض كل الوظائف", en: "View all jobs" },
  "home.shifts.label": { ar: "عمل مرن", en: "Flexible work" },
  "home.shifts.title": { ar: "شيفتات متاحة الآن", en: "Shifts available now" },
  "home.shifts.subtitle": {
    ar: "احصل على دخل إضافي مع شيفتات حسب الطلب لدى ناشري وظائف موثّقين.",
    en: "Earn extra income with on-demand shifts from verified employers.",
  },
  "home.shifts.cta": { ar: "عرض كل الشيفتات", en: "View all shifts" },
  "home.specialties.label": { ar: "حسب التخصص", en: "By specialty" },
  "home.specialties.title": { ar: "تصفّح حسب التخصص الطبي", en: "Browse by medical specialty" },
  "home.specialties.subtitle": {
    ar: "ابحث عن الفرصة المناسبة في مجالك — من الطب العام إلى التخصصات الدقيقة.",
    en: "Find the right opportunity in your field — from general practice to subspecialties.",
  },
  "home.specialties.cta": { ar: "عرض كل التخصصات", en: "View all specialties" },
  "home.guides.label": { ar: "أدلة مهنية", en: "Career guides" },
  "home.guides.title": { ar: "أحدث أدلة المهن الطبية", en: "Latest medical career guides" },
  "home.guides.subtitle": {
    ar: "إرشادات عملية حول التراخيص والرواتب وتطوير مسيرتك الصحية في المنطقة العربية.",
    en: "Practical guidance on licenses, salaries, and growing your healthcare career in the Arab world.",
  },
  "home.guides.cta": { ar: "تصفّح كل الأدلة", en: "View all guides" },
  "home.guides.readMinutes": { ar: "{n} دقائق قراءة", en: "{n} min read" },
  "home.cta.title": { ar: "ابدأ رحلتك مع SyndeoCare اليوم", en: "Start your SyndeoCare journey today" },
  "home.cta.subtitle": {
    ar: "مجانية تماماً للكوادر الصحية، وتجربة 30 يوماً لناشري الوظائف.",
    en: "Completely free for healthcare professionals, with a 30-day trial for employers.",
  },
  "home.cta.seeker": { ar: "إنشاء حساب مجاني", en: "Create a free account" },
  "home.cta.employer": { ar: "أنا ناشر وظائف", en: "I'm an employer" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: keyof typeof DICT | string) => string };

const LanguageContext = createContext<Ctx>({ lang: "ar", setLang: () => {}, t: (k) => String(k) });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = DICT[key];
      return entry ? entry[lang] : key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}
