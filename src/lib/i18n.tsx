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
