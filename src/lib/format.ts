export type Lang = "ar" | "en";

export const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  contract: "عقد مؤقت",
  locum: "بديل (Locum)",
  shift: "مناوبات",
};

export const EMPLOYMENT_LABELS_EN: Record<string, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
  locum: "Locum",
  shift: "Shifts",
};

export const APPLICATION_LABELS: Record<string, string> = {
  submitted: "جديد",
  reviewing: "قيد المراجعة",
  shortlisted: "قيد المراجعة",
  interview: "مقابلة / عرض",
  offer: "مقابلة / عرض",
  hired: "مُختار",
  rejected: "غير مُختار",
  withdrawn: "طلب مسحوب",
};

export const APPLICATION_LABELS_EN: Record<string, string> = {
  submitted: "New",
  reviewing: "Under review",
  shortlisted: "Under review",
  interview: "Interview / offer",
  offer: "Interview / offer",
  hired: "Selected",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

/** The four stages the product exposes. Legacy values collapse into them. */
export const APPLICATION_STAGES = ["submitted", "reviewing", "interview", "hired"] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

/** Maps any stored application status onto one of the four exposed stages (or "rejected"). */
export function applicationStage(status: string): ApplicationStage | "rejected" | "withdrawn" {
  switch (status) {
    case "withdrawn":
      return "withdrawn";
    case "shortlisted":
      return "reviewing";
    case "offer":
      return "interview";
    case "rejected":
      return "rejected";
    case "submitted":
    case "reviewing":
    case "interview":
    case "hired":
      return status;
    default:
      return "submitted";
  }
}

/** Turns a pipeline RPC error code into natural language. */
export function applicationErrorText(raw: string, lang: "ar" | "en" = "ar") {
  const code = [
    "JOB_CLOSED_MANUALLY",
    "NOT_FOUND",
    "FORBIDDEN",
    "ALREADY_HIRED",
    "JOB_CLOSED",
    "VACANCIES_FILLED",
    "NOT_HIRED",
    "USE_HIRE_APPLICANT",
    "WITHDRAW_IS_CANDIDATE_ONLY",
    "APPLICATION_WITHDRAWN",
    "APPLICATION_REJECTED",
  ].find((k) => raw.includes(k));
  const ar: Record<string, string> = {
    NOT_FOUND: "لم نعثر على هذا الطلب.",
    FORBIDDEN: "هذا الطلب لا يخص وظائف منشأتك.",
    ALREADY_HIRED: "هذا المرشح مُختار بالفعل.",
    JOB_CLOSED: "الوظيفة مقفلة — لا يمكن تعديل المراحل.",
    JOB_CLOSED_MANUALLY: "أعد فتح الوظيفة أولاً ثم تراجع عن الاختيار.",
    VACANCIES_FILLED: "اكتملت شواغر هذه الوظيفة.",
    NOT_HIRED: "هذا المرشح غير مُختار أصلاً.",
    USE_HIRE_APPLICANT: "استخدم زر اختيار المرشح.",
    WITHDRAW_IS_CANDIDATE_ONLY: "سحب الطلب قرار يخص المتقدم نفسه.",
    APPLICATION_WITHDRAWN: "سحب المتقدم طلبه — لم يعد بالإمكان تغيير مرحلته.",
    APPLICATION_REJECTED: "هذا الطلب في حالة «غير مُختار».",
  };
  const en: Record<string, string> = {
    NOT_FOUND: "We couldn't find this application.",
    FORBIDDEN: "This application doesn't belong to your facility.",
    ALREADY_HIRED: "This candidate is already selected.",
    JOB_CLOSED: "The job is closed — stages can't be changed.",
    JOB_CLOSED_MANUALLY: "Reopen the job first, then undo the selection.",
    VACANCIES_FILLED: "All positions for this job are filled.",
    NOT_HIRED: "This candidate isn't selected.",
    USE_HIRE_APPLICANT: "Use the select-candidate button.",
    WITHDRAW_IS_CANDIDATE_ONLY: "Withdrawing is the candidate's own decision.",
    APPLICATION_WITHDRAWN: "The candidate withdrew this application — its stage can't change.",
    APPLICATION_REJECTED: "This application is marked as not selected.",
  };
  if (!code) return lang === "ar" ? "تعذّر إتمام العملية." : "The action couldn't be completed.";
  return (lang === "ar" ? ar : en)[code]!;
}

export const CREDENTIAL_LABELS: Record<string, string> = {
  pending: "بانتظار المراجعة",
  approved: "موثّق",
  rejected: "مرفوض",
};

export const CREDENTIAL_LABELS_EN: Record<string, string> = {
  pending: "Pending review",
  approved: "Verified",
  rejected: "Rejected",
};

export function employmentLabel(key: string, lang: Lang = "ar") {
  return (lang === "en" ? EMPLOYMENT_LABELS_EN : EMPLOYMENT_LABELS)[key] ?? key;
}

export function applicationLabel(key: string, lang: Lang = "ar") {
  return (lang === "en" ? APPLICATION_LABELS_EN : APPLICATION_LABELS)[key] ?? key;
}

export function credentialLabel(key: string, lang: Lang = "ar") {
  return (lang === "en" ? CREDENTIAL_LABELS_EN : CREDENTIAL_LABELS)[key] ?? key;
}

/** Picks the localized name of a joined specialty row. */
export function specialtyName(
  row: { name_ar?: string | null; name_en?: string | null } | null | undefined,
  lang: Lang = "ar",
) {
  if (!row) return "";
  if (lang === "en") return row.name_en || row.name_ar || "";
  return row.name_ar || row.name_en || "";
}

export const DOC_TYPES = [
  "ترخيص مزاولة المهنة",
  "شهادة البكالوريوس",
  "شهادة الزمالة / الماجستير",
  "شهادة خبرة",
  "بطاقة الهوية / الجواز",
  "شهادة دورة تدريبية",
];

export const DOC_TYPES_EN = [
  "Professional practice license",
  "Bachelor's degree",
  "Fellowship / Master's degree",
  "Experience certificate",
  "ID / Passport",
  "Training certificate",
];

export function docTypes(lang: Lang = "ar") {
  return lang === "en" ? DOC_TYPES_EN : DOC_TYPES;
}

export function docTypeLabel(value: string, lang: Lang = "ar") {
  if (lang !== "en") return value;
  const i = DOC_TYPES.indexOf(value);
  return i >= 0 ? (DOC_TYPES_EN[i] as string) : value;
}

export const COUNTRIES = [
  "اليمن",
  "السعودية",
  "الإمارات",
  "مصر",
  "الكويت",
  "قطر",
  "الأردن",
  "البحرين",
  "عُمان",
  "المغرب",
  "الجزائر",
  "تونس",
  "العراق",
  "لبنان",
];

const COUNTRY_EN: Record<string, string> = {
  "اليمن": "Yemen",
  "السعودية": "Saudi Arabia",
  "الإمارات": "UAE",
  "مصر": "Egypt",
  "الكويت": "Kuwait",
  "قطر": "Qatar",
  "الأردن": "Jordan",
  "البحرين": "Bahrain",
  "عُمان": "Oman",
  "المغرب": "Morocco",
  "الجزائر": "Algeria",
  "تونس": "Tunisia",
  "العراق": "Iraq",
  "لبنان": "Lebanon",
};

/** Country names are stored in Arabic; show an English label when available. */
/** بعض السجلات القديمة تخزّن رمز الدولة (YE) بدل الاسم — نعيده إلى اسم مقروء. */
const COUNTRY_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_EN).map(([ar, en]) => [en, ar]),
);
const ISO_COUNTRY: Record<string, string> = {
  YE: "اليمن",
  SA: "السعودية",
  AE: "الإمارات",
  EG: "مصر",
  JO: "الأردن",
  OM: "عُمان",
  QA: "قطر",
  KW: "الكويت",
  BH: "البحرين",
  IQ: "العراق",
  SD: "السودان",
};

export function countryLabel(value: string | null | undefined, lang: Lang = "ar") {
  if (!value) return "";
  const canonical = ISO_COUNTRY[value.toUpperCase()] ?? COUNTRY_BY_CODE[value] ?? value;
  return lang === "en" ? (COUNTRY_EN[canonical] ?? canonical) : canonical;
}

function locale(lang: Lang) {
  return lang === "en" ? "en-US" : "ar-EG-u-nu-latn";
}

export function formatSalary(min: number, max: number, currency: string, lang: Lang = "ar") {
  const n = (v: number) => new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 0 }).format(v);
  return `${n(min)} – ${n(max)} ${currency}`;
}

export function formatMoney(v: number, currency: string, lang: Lang = "ar") {
  return `${new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 0 }).format(v)} ${currency}`;
}

export function formatDateTime(value: string, lang: Lang = "ar") {
  return new Date(value).toLocaleString(locale(lang), {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string, lang: Lang = "ar") {
  return new Date(value).toLocaleDateString(locale(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function hoursBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 3600000);
}

export function relativeTime(value: string, lang: Lang = "ar") {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (lang === "en") {
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 30) return `قبل ${days} يوم`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}

export const FACILITY_DOC_TYPES = [
  "رخصة مزاولة المنشأة",
  "السجل التجاري",
  "البطاقة الضريبية",
  "هوية المفوّض بالتوقيع",
  "شهادة اعتماد أو جودة",
];

export const FACILITY_DOC_TYPES_EN = [
  "Facility operating license",
  "Commercial registration",
  "Tax card",
  "Authorized signatory ID",
  "Accreditation / quality certificate",
];

/** Document types that must be approved before a facility becomes verified. */
export const FACILITY_REQUIRED_DOCS = ["رخصة مزاولة المنشأة", "السجل التجاري"];

/** Document types a professional needs approved to earn the verified badge. */
export const PRO_REQUIRED_DOCS = ["ترخيص مزاولة المهنة", "بطاقة الهوية / الجواز"];

export function facilityDocTypes(lang: Lang = "ar") {
  return lang === "en" ? FACILITY_DOC_TYPES_EN : FACILITY_DOC_TYPES;
}

export function facilityDocTypeLabel(value: string, lang: Lang = "ar") {
  if (lang !== "en") return value;
  const i = FACILITY_DOC_TYPES.indexOf(value);
  return i >= 0 ? (FACILITY_DOC_TYPES_EN[i] as string) : value;
}

/** صياغة سنوات الخبرة بجمع عربي صحيح (سنة/سنتان/سنوات). */
export function experienceLabel(n: number, lang: Lang = "ar") {
  if (lang === "en") return `${n} year${n === 1 ? "" : "s"} experience`;
  if (n === 0) return "بدون خبرة مسجّلة";
  if (n === 1) return "خبرة سنة واحدة";
  if (n === 2) return "خبرة سنتان";
  if (n <= 10) return `خبرة ${n} سنوات`;
  return `خبرة ${n} سنة`;
}
