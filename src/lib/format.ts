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
  submitted: "تم التقديم",
  reviewing: "قيد المراجعة",
  shortlisted: "قائمة مختصرة",
  interview: "مقابلة",
  offer: "عرض وظيفي",
  hired: "تم التعيين",
  rejected: "غير مقبول",
};

export const APPLICATION_LABELS_EN: Record<string, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not selected",
};

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
export function countryLabel(value: string | null | undefined, lang: Lang = "ar") {
  if (!value) return "";
  return lang === "en" ? (COUNTRY_EN[value] ?? value) : value;
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
