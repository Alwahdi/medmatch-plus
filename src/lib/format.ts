export const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  contract: "عقد مؤقت",
  locum: "بديل (Locum)",
  shift: "مناوبات",
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

export const CREDENTIAL_LABELS: Record<string, string> = {
  pending: "بانتظار المراجعة",
  approved: "موثّق",
  rejected: "مرفوض",
};

export const DOC_TYPES = [
  "ترخيص مزاولة المهنة",
  "شهادة البكالوريوس",
  "شهادة الزمالة / الماجستير",
  "شهادة خبرة",
  "بطاقة الهوية / الجواز",
  "شهادة دورة تدريبية",
];

export const COUNTRIES = [
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

export function formatSalary(min: number, max: number, currency: string) {
  const n = (v: number) => new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 }).format(v);
  return `${n(min)} – ${n(max)} ${currency}`;
}

export function formatMoney(v: number, currency: string) {
  return `${new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 }).format(v)} ${currency}`;
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ar-EG-u-nu-latn", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" });
}

export function hoursBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 3600000);
}

export function relativeTime(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 30) return `قبل ${days} يوم`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}
