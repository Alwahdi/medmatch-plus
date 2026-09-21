import type { Lang } from "./i18n";

const locales: Record<Lang, string> = { ar: "ar", en: "en" };

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined, lang: Lang) {
  if (amount == null) return "—";
  const code = currency || "YER";
  try {
    return new Intl.NumberFormat(locales[lang], {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(locales[lang]).format(amount)} ${code}`;
  }
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
  lang: Lang,
) {
  if (!min && !max) return lang === "ar" ? "غير محدد" : "Not specified";
  if (min && max && min !== max) return `${formatMoney(min, currency, lang)} – ${formatMoney(max, currency, lang)}`;
  return formatMoney(max || min, currency, lang);
}

export function formatDate(value: string | null | undefined, lang: Lang) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locales[lang], { dateStyle: "medium" }).format(d);
}

export function formatDateTime(value: string | null | undefined, lang: Lang) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locales[lang], { dateStyle: "medium", timeStyle: "short" }).format(d);
}

/** الوقت فقط داخل فقاعات المحادثة. */
export function formatTime(value: string | null | undefined, lang: Lang) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locales[lang], { hour: "2-digit", minute: "2-digit" }).format(d);
}

export const dayKey = (value: string | null | undefined) => (value ? new Date(value).toDateString() : "");

/** فاصل يومي في المحادثة: اليوم / أمس / تاريخ كامل. */
export function formatDayLabel(value: string | null | undefined, lang: Lang) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return lang === "ar" ? "اليوم" : "Today";
  if (d.toDateString() === yesterday.toDateString()) return lang === "ar" ? "أمس" : "Yesterday";
  return new Intl.DateTimeFormat(locales[lang], { dateStyle: "long" }).format(d);
}


export function relativeTime(value: string | null | undefined, lang: Lang) {
  if (!value) return "";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "";
  const diffSec = Math.round((d - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const past = diffSec < 0;

  // Hermes (Expo Go / بعض أجهزة أندرويد) لا يدعم Intl.RelativeTimeFormat —
  // تنفيذ يدوي بصياغة عربية/إنجليزية طبيعية.
  const arPlural = (n: number, one: string, two: string, few: string, many: string) =>
    n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`;

  if (abs < 60) return lang === "ar" ? "الآن" : "just now";
  const mins = Math.round(abs / 60);
  if (mins < 60) {
    if (lang === "ar") return past ? `منذ ${arPlural(mins, "دقيقة", "دقيقتين", "دقائق", "دقيقة")}` : `بعد ${arPlural(mins, "دقيقة", "دقيقتين", "دقائق", "دقيقة")}`;
    return past ? `${mins} min ago` : `in ${mins} min`;
  }
  const hours = Math.round(mins / 60);
  if (hours < 24) {
    if (lang === "ar") return past ? `منذ ${arPlural(hours, "ساعة", "ساعتين", "ساعات", "ساعة")}` : `بعد ${arPlural(hours, "ساعة", "ساعتين", "ساعات", "ساعة")}`;
    return past ? `${hours} hr ago` : `in ${hours} hr`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    if (lang === "ar") return past ? (days === 1 ? "أمس" : `منذ ${arPlural(days, "يوم", "يومين", "أيام", "يوماً")}`) : `بعد ${arPlural(days, "يوم", "يومين", "أيام", "يوماً")}`;
    return past ? (days === 1 ? "yesterday" : `${days} days ago`) : `in ${days} days`;
  }
  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    if (lang === "ar") return past ? `منذ ${arPlural(weeks, "أسبوع", "أسبوعين", "أسابيع", "أسبوعاً")}` : `بعد ${arPlural(weeks, "أسبوع", "أسبوعين", "أسابيع", "أسبوعاً")}`;
    return past ? `${weeks} wk ago` : `in ${weeks} wk`;
  }
  const months = Math.round(days / 30);
  if (months < 12) {
    if (lang === "ar") return past ? `منذ ${arPlural(months, "شهر", "شهرين", "أشهر", "شهراً")}` : `بعد ${arPlural(months, "شهر", "شهرين", "أشهر", "شهراً")}`;
    return past ? `${months} mo ago` : `in ${months} mo`;
  }
  const years = Math.round(days / 365);
  if (lang === "ar") return past ? `منذ ${arPlural(years, "سنة", "سنتين", "سنوات", "سنة")}` : `بعد ${arPlural(years, "سنة", "سنتين", "سنوات", "سنة")}`;
  return past ? `${years} yr ago` : `in ${years} yr`;
}

export const employmentTypeLabel = (type: string | null | undefined, lang: Lang) => {
  const map: Record<string, { ar: string; en: string }> = {
    full_time: { ar: "دوام كامل", en: "Full time" },
    part_time: { ar: "دوام جزئي", en: "Part time" },
    contract: { ar: "عقد", en: "Contract" },
    locum: { ar: "بديل مؤقت", en: "Locum" },
    shift: { ar: "مناوبة", en: "Shift" },
  };
  if (!type) return "—";
  return map[type]?.[lang] ?? type;
};

export const applicationStatusLabel = (status: string, lang: Lang) => {
  const map: Record<string, { ar: string; en: string }> = {
    submitted: { ar: "تم الإرسال", en: "Submitted" },
    reviewing: { ar: "قيد المراجعة", en: "Reviewing" },
    shortlisted: { ar: "قائمة مختصرة", en: "Shortlisted" },
    interview: { ar: "مقابلة", en: "Interview" },
    offer: { ar: "عرض", en: "Offer" },
    hired: { ar: "تم التوظيف", en: "Hired" },
    rejected: { ar: "غير مقبول", en: "Rejected" },
    withdrawn: { ar: "مسحوب", en: "Withdrawn" },
  };
  return map[status]?.[lang] ?? status;
};

export const bookingStatusLabel = (status: string, lang: Lang) => {
  const map: Record<string, { ar: string; en: string }> = {
    booked: { ar: "محجوزة", en: "Booked" },
    cancelled: { ar: "ملغاة", en: "Cancelled" },
    completed: { ar: "منتهية", en: "Completed" },
    open: { ar: "متاحة", en: "Open" },
  };
  return map[status]?.[lang] ?? status;
};
