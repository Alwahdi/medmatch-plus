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

export function relativeTime(value: string | null | undefined, lang: Lang) {
  if (!value) return "";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Math.round((d - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locales[lang], { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "year";
  let divisor = 31557600;
  let previous = 1;
  for (const [limit, step] of steps) {
    if (Math.abs(diff) < limit) {
      unit = step === "second" ? "second" : step;
      divisor = previous;
      break;
    }
    previous = limit;
  }
  if (Math.abs(diff) >= 31557600) {
    unit = "year";
    divisor = 31557600;
  }
  return rtf.format(Math.round(diff / (divisor || 1)), unit);
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
