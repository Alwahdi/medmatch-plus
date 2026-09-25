import type { Lang } from "./i18n";

const MAP: Record<string, { ar: string; en: string }> = {
  NOT_AUTHENTICATED: { ar: "سجّل الدخول أولاً ثم أعد المحاولة.", en: "Sign in first, then try again." },
  UNAUTHENTICATED: { ar: "سجّل الدخول أولاً ثم أعد المحاولة.", en: "Sign in first, then try again." },
  MFA_REQUIRED: {
    ar: "تحتاج هذه العملية إلى تأكيد التحقق بخطوتين من صفحة الأمان.",
    en: "This action needs two-step verification from Security.",
  },
  PROFESSIONAL_REQUIRED: {
    ar: "هذا الإجراء متاح لحسابات الكوادر الصحية فقط.",
    en: "Only healthcare professional accounts can do this.",
  },
  FACILITY_NOT_VERIFIED: {
    ar: "النشر متاح للمنشآت الموثقة فقط. ارفع مستندات المنشأة وانتظر اعتمادها.",
    en: "Publishing is available to verified facilities only. Upload your facility documents and wait for approval.",
  },
  PROFESSIONAL_NOT_VERIFIED: {
    ar: "التقديم والحجز متاحان للكوادر الموثقة فقط. ارفع مستنداتك وانتظر اعتمادها.",
    en: "Applying and booking are available to verified professionals only. Upload your documents and wait for approval.",
  },
  FACILITY_PROFILE_INCOMPLETE: {
    ar: "أكمل اسم المنشأة ونوعها والدولة والمدينة ثم أعد المحاولة.",
    en: "Complete the facility name, type, country and city, then try again.",
  },
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
    ar: "أكمل الاسم والتخصص والدولة والمدينة وسنوات الخبرة ثم أعد المحاولة.",
    en: "Complete your name, specialty, country, city and experience, then try again.",
  },
  ALREADY_APPLIED: { ar: "سبق أن قدّمت على هذه الوظيفة.", en: "You already applied to this job." },
  SHIFT_UNAVAILABLE: { ar: "هذه المناوبة لم تعد متاحة؛ قد تكون حُجزت أو بدأ وقتها.", en: "This shift is no longer available; it may be booked or already started." },
  SHIFT_NOT_OPEN: { ar: "هذه المناوبة لم تعد متاحة.", en: "This shift is no longer available." },
  COVER_TOO_LONG: { ar: "نص التقديم طويل جداً. الحد الأقصى 2000 حرف.", en: "Your cover letter is too long. The maximum is 2,000 characters." },
  ACCOUNT_TYPE_CONFLICT: {
    ar: "هذا الحساب مرتبط بنوع حساب آخر. استخدم حساباً مختلفاً للنوع الآخر.",
    en: "This account already uses another account type. Use a different account for the other type.",
  },
  NO_PROFESSIONAL_PROFILE: { ar: "أنشئ ملف المختص أولاً.", en: "Create your professional profile first." },
  INVALID_INPUT: { ar: "تحقق من البيانات المدخلة ثم أعد المحاولة.", en: "Check the entered information and try again." },
  LISTING_IDENTITY_DISCLOSURE: {
    ar: "احذف اسم المنشأة أو معلومات التواصل المباشر من نص الفرصة.",
    en: "Remove the facility name or direct contact details from the listing text.",
  },
  jobs_title_ck: { ar: "عنوان الوظيفة يجب أن يكون بين 3 و120 حرفاً.", en: "The job title must be between 3 and 120 characters." },
  shifts_title_ck: { ar: "عنوان المناوبة يجب أن يكون بين حرفين و120 حرفاً.", en: "The shift title must be between 2 and 120 characters." },
  jobs_description_ck: { ar: "وصف الوظيفة يجب أن يكون بين 20 و5000 حرف.", en: "The job description must be between 20 and 5,000 characters." },
  jobs_salary_ck: { ar: "تحقق من الراتب؛ يجب ألا يكون سالباً وأن يسبق الحد الأدنى الحد الأعلى.", en: "Check the salary; values cannot be negative and the minimum cannot exceed the maximum." },
  jobs_vacancies_ck: { ar: "عدد الشواغر يجب أن يكون بين 1 و100.", en: "Vacancies must be between 1 and 100." },
  jobs_experience_ck: { ar: "سنوات الخبرة يجب أن تكون بين 0 و60.", en: "Experience must be between 0 and 60 years." },
  hp_years_ck: { ar: "سنوات الخبرة يجب أن تكون بين 0 و60.", en: "Experience must be between 0 and 60 years." },
  shifts_rate_ck: { ar: "أجر الساعة غير صالح.", en: "The hourly rate is invalid." },
  hp_searchable_requires_consent: { ar: "أكد موافقتك قبل الظهور في بحث المنشآت.", en: "Confirm your consent before appearing in facility search." },
  FILE_TOO_LARGE: { ar: "حجم الملف يتجاوز 10 م.ب. اختر ملفاً أصغر.", en: "File exceeds 10 MB. Choose a smaller file." },
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
