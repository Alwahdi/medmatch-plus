import type { Lang } from "@/lib/i18n";

/**
 * تحويل أخطاء المصادقة/قاعدة البيانات/التخزين المعروفة إلى نص مفهوم للمستخدم،
 * مع تسجيل الخطأ الأصلي في الكونسول للمتابعة التقنية.
 */

type Rule = { test: RegExp; ar: string; en: string };

const RULES: Rule[] = [
  // نوع حساب واحد لكل مستخدم (كادر صحي أو منشأة)
  {
    test: /ACCOUNT_TYPE_CONFLICT/i,
    ar: "هذا الحساب مسجّل بنوع واحد فقط (كادر صحي أو منشأة)، ولا يمكن الجمع بين النوعين. استخدم بريداً آخر إذا احتجت النوع الآخر.",
    en: "This account is registered as one type only (healthcare professional or facility) and can't be both. Use a different email if you need the other type.",
  },
  // خصوصية هوية المنشأة داخل نصوص الفرص العامة
  {
    test: /LISTING_IDENTITY_DISCLOSURE/i,
    ar: "لا يمكن نشر النص لأنه يحتوي على اسم المنشأة أو وسيلة تواصل مباشرة (رابط أو بريد أو رقم). احذفها ثم أعد المحاولة.",
    en: "We can't publish this text because it includes your facility name or a direct contact detail (link, email, or number). Remove it and try again.",
  },
  // طلبات حذف الحساب
  {
    test: /REASON_TOO_LONG/i,
    ar: "السبب طويل جداً. اختصره إلى 1000 حرف أو أقل.",
    en: "That reason is too long. Shorten it to 1000 characters or fewer.",
  },
  {
    test: /REQUEST_NOT_CANCELLABLE/i,
    ar: "لا يمكن إلغاء الطلب بعد بدء معالجته. تواصل معنا إذا غيّرت رأيك.",
    en: "This request can't be cancelled once processing has started. Contact us if you changed your mind.",
  },
  {
    test: /INVALID_DELETION_TRANSITION|INVALID_DELETION_STATUS/i,
    ar: "لا يمكن نقل الطلب إلى هذه الحالة من حالته الحالية.",
    en: "The request can't move to that status from its current state.",
  },
  {
    test: /REQUEST_NOT_FOUND/i,
    ar: "لم نعثر على هذا الطلب. حدّث الصفحة ثم حاول مجدداً.",
    en: "We couldn't find that request. Refresh the page and try again.",
  },
  // موقع المنشأة
  {
    test: /WEBSITE_TOO_LONG/i,
    ar: "رابط الموقع طويل جداً. استخدم رابطاً لا يتجاوز 300 حرف.",
    en: "The website link is too long. Use a link of 300 characters or fewer.",
  },
  {
    test: /WEBSITE_INVALID/i,
    ar: "رابط الموقع غير صالح. اكتبه بصيغة example.com أو https://example.com.",
    en: "That website link isn't valid. Enter it like example.com or https://example.com.",
  },
  // حذف الفرص مع وجود سجل توظيف
  {
    test: /JOB_HAS_HISTORY/i,
    ar: "لا يمكن حذف هذه الوظيفة لأن لها سجل توظيف (تقديمات أو دعوات أو محادثات أو مقابلات). أغلق الوظيفة بدلاً من حذفها للحفاظ على السجل.",
    en: "This job can't be deleted because it already has recruitment history (applications, invitations, conversations, or interviews). Close it instead to keep the record.",
  },
  {
    test: /SHIFT_HAS_HISTORY/i,
    ar: "لا يمكن حذف هذه المناوبة لأن لها سجل توظيف (حجوزات أو دعوات أو محادثات أو مقابلات). ألغِ المناوبة بدلاً من حذفها للحفاظ على السجل.",
    en: "This shift can't be deleted because it already has recruitment history (bookings, invitations, conversations, or interviews). Cancel it instead to keep the record.",
  },
  // الرسائل والمرفقات

  {
    test: /MESSAGE_TOO_LONG/i,
    ar: "الرسالة طويلة جداً. اختصرها إلى 2000 حرف أو أقل.",
    en: "This message is too long. Shorten it to 2000 characters or fewer.",
  },
  {
    test: /MESSAGE_EMPTY/i,
    ar: "اكتب رسالة أو أرفق ملفاً قبل الإرسال.",
    en: "Write a message or attach a file before sending.",
  },
  {
    test: /ATTACHMENT_PATH_TOO_LONG|INVALID_ATTACHMENT_NAME/i,
    ar: "اسم الملف طويل جداً. أعد تسميته ثم أرفقه مرة أخرى.",
    en: "The file name is too long. Rename it and attach it again.",
  },
  {
    test: /INVALID_ATTACHMENT_TYPE/i,
    ar: "نوع الملف غير مدعوم. أرفق صورة أو مستنداً أو تسجيلاً صوتياً.",
    en: "This file type isn't supported. Attach an image, a document, or a voice note.",
  },
  {
    test: /INVALID_ATTACHMENT_SIZE/i,
    ar: "حجم الملف يجب أن يكون أكبر من صفر ولا يتجاوز 10 ميغابايت.",
    en: "The file must be larger than zero and no more than 10 MB.",
  },
  {
    test: /INVALID_REACTION/i,
    ar: "هذا التفاعل غير صالح. اختر رمزاً من القائمة.",
    en: "That reaction isn't valid. Pick one from the list.",
  },
  // طلبات تعديل البيانات
  {
    test: /INVALID_MEDIA_PATH/i,
    ar: "الصورة غير صالحة. ارفع الصورة من جهازك بدل استخدام رابط خارجي.",
    en: "This image isn't valid. Upload the image from your device instead of using an external link.",
  },
  {
    test: /INVALID_ATTACHMENT_PATH/i,
    ar: "المرفق غير صالح. أعد رفع الملف من جهازك ثم أرسل الطلب.",
    en: "The attachment isn't valid. Upload the file again, then submit the request.",
  },
  {
    test: /INVALID_REQUEST_TARGET/i,
    ar: "لا يمكن طلب تعديل هذا الحقل. اختر حقلاً من القائمة المتاحة.",
    en: "This field can't be changed by request. Pick one from the available list.",
  },
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
