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
  "nav.jobs": { ar: "الفرص", en: "Opportunities" },
  "nav.shifts": { ar: "المناوبات", en: "Shifts" },
  "nav.guides": { ar: "الأدلة", en: "Guides" },
  "nav.questions": { ar: "بنوك الأسئلة", en: "Question banks" },
  "nav.about": { ar: "من نحن", en: "About" },
  "nav.contact": { ar: "اتصل بنا", en: "Contact" },
  "nav.postJob": { ar: "انشر وظيفة", en: "Post a job" },
  "nav.specialties": { ar: "التخصصات", en: "Specialties" },
  "nav.forFacilities": { ar: "للمنشآت", en: "For facilities" },
  "nav.pricing": { ar: "للمنشآت", en: "For facilities" },
  "nav.account": { ar: "حسابي", en: "Account" },
  "nav.dashboard": { ar: "لوحتي", en: "Dashboard" },
  "nav.messages": { ar: "الرسائل", en: "Messages" },
  "nav.candidates": { ar: "البحث عن الكفاءات", en: "Talent search" },
  "nav.profile": { ar: "ملفي المهني", en: "My profile" },
  "nav.activity": { ar: "نشاطي", en: "My activity" },
  "nav.credentials": { ar: "ملف الاعتماد", en: "Credentials" },
  "nav.applications": { ar: "طلباتي", en: "My applications" },
  "nav.invitations": { ar: "الدعوات", en: "Invitations" },
  "nav.notifications": { ar: "الإشعارات", en: "Notifications" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },
  "nav.cv": { ar: "سيرتي الذاتية", en: "My CV" },
  "nav.cvImport": { ar: "بناء الملف من السيرة", en: "Build profile from CV" },
  "nav.saved": { ar: "الوظائف المحفوظة", en: "Saved jobs" },
  "nav.alerts": { ar: "تنبيهات الوظائف", en: "Job alerts" },
  "nav.admin": { ar: "لوحة الإدارة", en: "Admin" },
  "nav.signOut": { ar: "تسجيل الخروج", en: "Sign out" },
  "nav.signIn": { ar: "تسجيل الدخول", en: "Sign in" },
  "nav.signUp": { ar: "إنشاء حساب", en: "Sign up" },
  "nav.menu": { ar: "القائمة", en: "Menu" },
  "nav.myShifts": { ar: "مناوباتي", en: "My shifts" },
  "nav.facilityHome": { ar: "لوحة المنشأة", en: "Facility dashboard" },
  "nav.facilityProfile": { ar: "ملف المنشأة", en: "Facility profile" },
  "nav.facilityVerification": { ar: "توثيق المنشأة", en: "Facility verification" },
  "nav.security": { ar: "الأمان وتسجيل الدخول", en: "Security & sign-in" },

  "dash.proArea": { ar: "حسابي", en: "My account" },
  "dash.facilityArea": { ar: "منطقة المنشأة", en: "Employer area" },
  "lang.switch": { ar: "English", en: "العربية" },
  "lang.label": { ar: "تغيير اللغة", en: "Change language" },

  "footer.tagline": {
    ar: "منصة عربية تربط الكوادر الصحية بالمستشفيات والعيادات: وظائف دائمة، مناوبات فورية، وتوثيق تراخيص موحّد.",
    en: "An Arabic-first platform connecting healthcare professionals with hospitals and clinics: permanent jobs, instant shifts, and unified license verification.",
  },
  "footer.forPros": { ar: "للكوادر الصحية", en: "For professionals" },
  "footer.browseJobs": { ar: "تصفح الفرص", en: "Browse opportunities" },
  "footer.shiftMarket": { ar: "سوق المناوبات", en: "Shift marketplace" },
  "footer.createProfile": { ar: "إنشاء ملف مهني", en: "Create a profile" },
  "footer.forFacilities": { ar: "للمنشآت", en: "For facilities" },
  "footer.howItWorks": { ar: "كيف تعمل المنصة", en: "How it works" },
  "footer.plans": { ar: "للمنشآت", en: "For facilities" },
  "footer.registerFacility": { ar: "تسجيل منشأة", en: "Register a facility" },
  "footer.resources": { ar: "المصادر", en: "Resources" },
  "footer.blog": { ar: "المدونة", en: "Blog" },
  "footer.cookies": { ar: "ملفات الارتباط", en: "Cookies" },
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
    ar: "كل الكفاءات الطبية التي تحتاجها — أطباء، صيادلة، تمريض، وفنيون — في مكان واحد. وظائف دائمة، مناوبات فورية، وشارة توثيق واضحة للحسابات المراجَعة.",
    en: "All the medical talent you need — doctors, pharmacists, nurses, and technicians — in one place. Permanent jobs, instant shifts, and a clear verification badge on reviewed accounts.",
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
  "home.search.button": { ar: "ابحث", en: "Search" },
  "home.why.label": { ar: "لماذا SyndeoCare", en: "Why SyndeoCare" },
  "home.why.verified.title": { ar: "توثيق واضح للناشرين", en: "Clear employer verification" },
  "home.why.verified.text": {
    ar: "المستشفيات والعيادات والمعامل والصيدليات ترفع وثائقها للمراجعة، وتظهر الشارة لمن تم اعتماده.",
    en: "Hospitals, clinics, labs, and pharmacies submit documents for review, and the badge appears only once approved.",
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
    ar: "ارفع سيرتك الذاتية ويبني الذكاء الاصطناعي ملفك في ثوانٍ، ثم تصفّح الوظائف والشيفتات مع ظهور حالة توثيق كل ناشر، وتقدّم فوراً.",
    en: "Upload your CV and AI builds your profile in seconds, then browse medical jobs and shifts with each employer's verification status shown, and apply instantly.",
  },
  "home.sides.pros.cta": { ar: "تصفّح الوظائف", en: "Browse jobs" },
  "home.sides.employers.label": { ar: "لناشري الوظائف", en: "For employers" },
  "home.sides.employers.title": { ar: "وظّف كوادر مؤهّلة بسرعة", en: "Hire qualified staff fast" },
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
    ar: "انشر وظيفة دائمة أو شيفتاً عاجلاً خلال دقائق — ليظهر فوراً للكوادر الصحية المسجّلة.",
    en: "Post a permanent job or urgent shift in minutes — instantly visible to registered healthcare candidates.",
  },
  "home.steps.employer2.title": { ar: "استقبل الطلبات", en: "Receive applications" },
  "home.steps.employer2.text": {
    ar: "تستقبل طلبات الكوادر المؤهّلة في مكان واحد، وترى حالة توثيق كل ملف.",
    en: "Applications from qualified candidates arrive in one place, and you see each profile's verification status.",
  },
  "home.steps.employer3.title": { ar: "تنبيه داخل المنصة عند كل طلب", en: "In-app application alerts" },
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
    ar: "وظائف دائمة وشيفتات فورية بأجر معلن، مع ظهور حالة توثيق الناشر.",
    en: "Permanent jobs and instant shifts with published pay, and each employer's verification status shown.",
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
    ar: "فرص جديدة منشورة من مستشفيات وعيادات ومنشآت متخصصة، مع بيان حالة التوثيق.",
    en: "New opportunities from hospitals, clinics, and specialized facilities, with verification status shown.",
  },
  "home.jobs.cta": { ar: "عرض كل الوظائف", en: "View all jobs" },
  "home.shifts.label": { ar: "عمل مرن", en: "Flexible work" },
  "home.shifts.title": { ar: "شيفتات متاحة الآن", en: "Shifts available now" },
  "home.shifts.subtitle": {
    ar: "احصل على دخل إضافي مع شيفتات حسب الطلب، مع بيان حالة توثيق الناشر.",
    en: "Earn extra income with on-demand shifts, with each employer's verification status shown.",
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

  // ---- Auth ----
  "auth.title": { ar: "أهلاً بك في SyndeoCare", en: "Welcome to SyndeoCare" },
  "auth.subtitle": {
    ar: "حساب واحد للوظائف والمناوبات وتوثيق التراخيص.",
    en: "One account for jobs, shifts, and license verification.",
  },
  "auth.signin": { ar: "تسجيل الدخول", en: "Sign in" },
  "auth.signup": { ar: "حساب جديد", en: "Create account" },
  "auth.email": { ar: "البريد الإلكتروني", en: "Email" },
  "auth.password": { ar: "كلمة المرور", en: "Password" },
  "auth.fullName": { ar: "الاسم الكامل", en: "Full name" },
  "auth.contactName": { ar: "اسم المسؤول", en: "Contact name" },
  "auth.doSignIn": { ar: "دخول", en: "Sign in" },
  "auth.signingIn": { ar: "جارٍ الدخول...", en: "Signing in..." },
  "auth.doSignUp": { ar: "إنشاء الحساب", en: "Create account" },
  "auth.signingUp": { ar: "جارٍ الإنشاء...", en: "Creating..." },
  "auth.or": { ar: "أو", en: "or" },
  "auth.google": { ar: "المتابعة باستخدام Google", en: "Continue with Google" },
  "auth.googleError": { ar: "تعذّر تسجيل الدخول عبر Google", en: "Google sign-in failed" },
  "auth.badCreds": { ar: "بيانات الدخول غير صحيحة", en: "Invalid email or password" },
  "auth.signedIn": { ar: "تم تسجيل الدخول", en: "Signed in" },
  "auth.roleQuestion": { ar: "أنا أسجّل كـ", en: "I'm signing up as" },
  "auth.rolePro": { ar: "كادر صحي", en: "Healthcare professional" },
  "auth.roleProHint": { ar: "أبحث عن وظيفة أو مناوبة", en: "Looking for a job or shift" },
  "auth.roleFacility": { ar: "منشأة صحية", en: "Healthcare employer" },
  "auth.roleFacilityHint": { ar: "أبحث عن كوادر للتوظيف", en: "Hiring medical staff" },
  "auth.confirmSent": {
    ar: "أرسلنا رسالة تأكيد إلى بريدك. افتح الرابط داخلها لتفعيل حسابك ثم عد لتسجيل الدخول.",
    en: "We sent a confirmation email. Open the link inside to activate your account, then sign in.",
  },
  "auth.terms": {
    ar: "بإنشاء حسابك أنت توافق على استخدام بياناتك لأغراض التوظيف داخل المنصة فقط.",
    en: "By creating an account you agree that your data is used for hiring purposes on this platform only.",
  },
  "auth.sideTitle": {
    ar: "حساب واحد يفتح لك سوق العمل الطبي العربي",
    en: "One account opens the Arab medical job market",
  },
  "auth.side1": { ar: "وظائف بأجر معلن", en: "Jobs with published pay" },
  "auth.side1d": {
    ar: "كل إعلان يعرض نطاق الراتب — لا مفاوضات في الظلام.",
    en: "Every listing shows a salary range — no negotiating blind.",
  },
  "auth.side2": { ar: "مناوبات تُحجز بنقرة", en: "Shifts booked in one click" },
  "auth.side2d": {
    ar: "غطِّ يومك الحر بمناوبة قريبة منك بأجر بالساعة واضح.",
    en: "Fill a free day with a nearby shift at a clear hourly rate.",
  },
  "auth.side3": { ar: "توثيق مرة واحدة", en: "Verify once" },
  "auth.side3d": {
    ar: "ارفع ترخيصك وشهاداتك، واستخدمها في كل تقديم.",
    en: "Upload your license and certificates once, reuse them on every application.",
  },
  "auth.side4": { ar: "سيرة ATS جاهزة", en: "ATS-ready CV" },
  "auth.side4d": {
    ar: "نبني سيرتك تلقائياً بصيغة تقرأها أنظمة الفرز.",
    en: "We build your CV automatically in a format screening systems can read.",
  },

  // ---- Onboarding ----
  "ob.title": { ar: "لنجهّز حسابك", en: "Let's set up your account" },
  "ob.subtitle": {
    ar: "دقيقتان وتبدأ في استقبال الفرص المناسبة لك.",
    en: "Two minutes and you'll start getting the right opportunities.",
  },
  "ob.step": { ar: "الخطوة {n} من {total}", en: "Step {n} of {total}" },
  "ob.next": { ar: "التالي", en: "Next" },
  "ob.back": { ar: "رجوع", en: "Back" },
  "ob.finish": { ar: "إنهاء والانتقال للوحة", en: "Finish and go to dashboard" },
  "ob.skip": { ar: "تخطي الآن", en: "Skip for now" },
  "ob.saving": { ar: "جارٍ الحفظ...", en: "Saving..." },
  "ob.pathTitle": { ar: "كيف تريد استخدام المنصة؟", en: "How will you use the platform?" },
  "ob.pro.step1": { ar: "بياناتك الأساسية", en: "Your basics" },
  "ob.pro.step2": { ar: "تخصصك وخبرتك", en: "Specialty and experience" },
  "ob.pro.step3": { ar: "الترخيص والسيرة", en: "License and CV" },
  "ob.fac.step1": { ar: "بيانات المنشأة", en: "Employer details" },
  "ob.fac.step2": { ar: "الموقع والوصف", en: "Location and description" },
  "ob.field.fullName": { ar: "الاسم الكامل", en: "Full name" },
  "ob.field.headline": { ar: "المسمى المهني", en: "Professional headline" },
  "ob.field.specialty": { ar: "التخصص", en: "Specialty" },
  "ob.field.years": { ar: "سنوات الخبرة", en: "Years of experience" },
  "ob.field.country": { ar: "الدولة", en: "Country" },
  "ob.field.city": { ar: "المدينة", en: "City" },
  "ob.field.license": { ar: "رقم الترخيص (اختياري)", en: "License number (optional)" },
  "ob.field.openShifts": { ar: "متاح لاستقبال المناوبات", en: "Available for shifts" },
  "ob.field.searchable": {
    ar: "إظهار ملفي للمنشآت في بحث المرشحين",
    en: "Show my profile to facilities in candidate search",
  },
  "ob.field.searchableHint": {
    ar: "عند تفعيله يمكن للمنشآت المؤهلة العثور على ملفك المهني. يمكنك إيقافه في أي وقت من ملفك.",
    en: "When on, eligible facilities can find your professional profile. You can turn it off any time from your profile.",
  },
  "ob.searchableFailed": {
    ar: "حُفظ ملفك، لكن تعذّر تفعيل الظهور في البحث. يمكنك تفعيله من ملفك المهني.",
    en: "Your profile was saved, but search visibility could not be enabled. You can turn it on from your profile.",
  },
  "ob.field.facName": { ar: "اسم المنشأة", en: "Employer name" },
  "ob.field.facType": { ar: "نوع المنشأة", en: "Employer type" },
  "ob.field.website": { ar: "الموقع الإلكتروني (اختياري)", en: "Website (optional)" },
  "ob.field.websiteHint": {
    ar: "اكتب النطاق فقط مثل example.com وسيُحفظ تلقائياً بصيغة https://",
    en: "Enter just the domain, like example.com — it will be saved as https://",
  },
  "ob.field.description": { ar: "نبذة عن المنشأة (اختياري)", en: "About the employer (optional)" },
  "ob.cvTitle": { ar: "عندك سيرة ذاتية؟", en: "Have a CV?" },
  "ob.cvBody": {
    ar: "ارفعها ودع الذكاء الاصطناعي يعبّئ ملفك المهني خلال ثوانٍ.",
    en: "Upload it and let AI fill your professional profile in seconds.",
  },
  "ob.cvCta": { ar: "بناء الملف من السيرة", en: "Build profile from CV" },
  "ob.done": { ar: "تم إعداد حسابك", en: "Your account is ready" },
  "ob.error": { ar: "تعذّر الحفظ، تحقق من البيانات", en: "Couldn't save, please check the fields" },
  "ob.selectPlaceholder": { ar: "اختر", en: "Select" },
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
