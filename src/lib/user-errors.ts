import type { Lang } from "@/lib/i18n";

/**
 * تحويل أخطاء المصادقة/قاعدة البيانات/التخزين المعروفة إلى نص مفهوم للمستخدم،
 * مع تسجيل الخطأ الأصلي في الكونسول للمتابعة التقنية.
 */

type Rule = { test: RegExp; ar: string; en: string };

const RULES: Rule[] = [
  // شبكة
  {
    test: /failed to fetch|networkerror|load failed|err_network|timeout/i,
    ar: "تعذّر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.",
    en: "Couldn't reach the server. Check your connection and try again.",
  },
  // مصادقة
  {
    test: /invalid login credentials/i,
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    en: "Email or password is incorrect.",
  },
  {
    test: /user already registered|already been registered|duplicate key.*users/i,
    ar: "هذا البريد مسجّل مسبقاً. سجّل الدخول أو استعد كلمة المرور.",
    en: "This email is already registered. Sign in or reset your password.",
  },
  {
    test: /email not confirmed/i,
    ar: "لم يتم تأكيد البريد بعد. افتح رسالة التأكيد أولاً.",
    en: "Your email isn't confirmed yet. Open the confirmation message first.",
  },
  {
    test: /password should be|weak password|password.*at least/i,
    ar: "كلمة المرور قصيرة أو ضعيفة. استخدم ٨ أحرف على الأقل مع أرقام.",
    en: "Password is too short or weak. Use at least 8 characters with numbers.",
  },
  {
    test: /same as the old password|new password should be different/i,
    ar: "كلمة المرور الجديدة يجب أن تختلف عن الحالية.",
    en: "The new password must be different from the current one.",
  },
  {
    test: /rate limit|too many requests|429/i,
    ar: "عدد المحاولات كبير. انتظر قليلاً ثم أعد المحاولة.",
    en: "Too many attempts. Wait a moment and try again.",
  },
  {
    test: /auth session missing|jwt|invalid token|not authenticated|session_not_found/i,
    ar: "انتهت جلستك. سجّل الدخول مرة أخرى.",
    en: "Your session expired. Please sign in again.",
  },
  // صلاحيات
  {
    test: /permission denied|row-level security|42501|not authorized|forbidden/i,
    ar: "لا تملك صلاحية تنفيذ هذا الإجراء.",
    en: "You don't have permission to do this.",
  },
  // قاعدة البيانات
  {
    test: /duplicate key|23505|already exists/i,
    ar: "هذا السجل موجود مسبقاً.",
    en: "This record already exists.",
  },
  {
    test: /violates foreign key|23503/i,
    ar: "بعض البيانات المرتبطة غير متاحة. حدّث الصفحة ثم أعد المحاولة.",
    en: "Some linked data is unavailable. Refresh the page and try again.",
  },
  {
    test: /violates check constraint|23514|invalid input syntax|22p02/i,
    ar: "بعض القيم غير صالحة. راجع الحقول ثم أعد المحاولة.",
    en: "Some values are invalid. Review the fields and try again.",
  },
  // تخزين
  {
    test: /payload too large|exceeded the maximum allowed size|entity too large|413/i,
    ar: "حجم الملف أكبر من المسموح.",
    en: "The file is larger than allowed.",
  },
  {
    test: /mime type|not supported|invalid_mime_type/i,
    ar: "نوع الملف غير مدعوم.",
    en: "This file type isn't supported.",
  },
];

const GENERIC = {
  ar: "تعذّر إتمام العملية. أعد المحاولة، ولم يُفقد أي شيء.",
  en: "We couldn't complete that. Please try again — nothing was lost.",
} as const;

/**
 * خطأ نصّه مكتوب داخل التطبيق ومقصود لعين المستخدم (نتيجة تحقق، رسالة مترجمة).
 * أي خطأ آخر يُعتبر تقنياً ولا يُعرض نصّه الخام.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/** اختصار لرمي رسالة مترجمة جاهزة للعرض. */
export function userError(message: string): never {
  throw new UserFacingError(message);
}

/**
 * رسالة مفهومة للمستخدم. رسائل `UserFacingError` تُعاد كما هي؛ الأخطاء المعروفة
 * تُترجم؛ وأي خطأ آخر (Supabase/RPC/تخزين) يُسجَّل تقنياً ويُعرض بنص عام.
 */
export function friendlyError(error: unknown, lang: Lang, fallback?: string): string {
  if (error) console.error("[error]", error);
  if (error instanceof UserFacingError && error.message.trim()) return error.message;

  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!raw.trim()) return fallback ?? GENERIC[lang];

  for (const rule of RULES) {
    if (rule.test.test(raw)) return rule[lang];
  }
  return fallback ?? GENERIC[lang];
}
