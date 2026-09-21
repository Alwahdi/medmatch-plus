import type { Lang } from "./i18n";

const MAP: Record<string, { ar: string; en: string }> = {
  CONSENT_REQUIRED_APPLICANT: {
    ar: "يجب الموافقة على التزامات المتقدم قبل إرسال الطلب.",
    en: "You must accept the applicant commitments before applying.",
  },
  CONSENT_REQUIRED_PUBLISHER: {
    ar: "يجب الموافقة على التزامات الناشر قبل النشر.",
    en: "You must accept the publisher commitments before publishing.",
  },
  VERIFICATION_REQUIRED: {
    ar: "يلزم اكتمال التوثيق قبل هذا الإجراء.",
    en: "Verification is required before this action.",
  },
  PROFILE_INCOMPLETE: {
    ar: "أكمل ملفك الشخصي قبل هذا الإجراء.",
    en: "Complete your profile before this action.",
  },
  ALREADY_APPLIED: { ar: "سبق أن قدّمت على هذه الوظيفة.", en: "You already applied to this job." },
  SHIFT_NOT_OPEN: { ar: "هذه المناوبة لم تعد متاحة.", en: "This shift is no longer available." },
  JOB_CLOSED: { ar: "هذه الوظيفة مغلقة.", en: "This job is closed." },
};

const AUTH: Record<string, { ar: string; en: string }> = {
  "Invalid login credentials": {
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    en: "Invalid email or password.",
  },
  "Email not confirmed": {
    ar: "لم يتم تأكيد البريد الإلكتروني بعد.",
    en: "Email is not confirmed yet.",
  },
  "User already registered": {
    ar: "هذا البريد مسجّل بالفعل.",
    en: "This email is already registered.",
  },
};

/** Never surface raw backend errors; map to human copy with a safe fallback. */
export function userMessage(error: unknown, lang: Lang): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  for (const [code, text] of Object.entries(MAP)) {
    if (raw.includes(code)) return text[lang];
  }
  for (const [code, text] of Object.entries(AUTH)) {
    if (raw.toLowerCase().includes(code.toLowerCase())) return text[lang];
  }
  if (/network|fetch/i.test(raw)) {
    return lang === "ar" ? "تعذّر الاتصال بالشبكة. تحقق من اتصالك." : "Network error. Check your connection.";
  }
  return lang === "ar" ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "Unexpected error. Please try again.";
}
