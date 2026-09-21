import { reportLovableError } from "@/lib/lovable-error-reporting";
import type { Lang } from "@/lib/i18n";

/**
 * تحويل أخطاء المصادقة/قاعدة البيانات/التخزين المعروفة إلى نص مفهوم للمستخدم،
 * مع تسجيل الخطأ الأصلي في الكونسول للمتابعة التقنية.
 */

type Rule = { test: RegExp; ar: string; en: string };

const RULES: Rule[] = [
  // متطلبات المستندات التي يضبطها الأدمن
  {
    test: /UNKNOWN_DOC_TYPE/i,
    ar: "نوع المستند غير متاح حالياً. حدّث الصفحة واختر نوعاً من القائمة.",
    en: "This document type isn't available. Refresh the page and pick a type from the list.",
  },
  {
    test: /DOC_EXPIRY_REQUIRED/i,
    ar: "تاريخ الانتهاء مطلوب لهذا النوع من المستندات.",
    en: "An expiry date is required for this document type.",
  },
  {
    test: /DOC_ISSUE_DATE_REQUIRED/i,
    ar: "تاريخ الإصدار مطلوب لهذا النوع من المستندات.",
    en: "An issue date is required for this document type.",
  },
  {
    test: /DOC_ISSUER_REQUIRED/i,
    ar: "جهة الإصدار مطلوبة لهذا النوع من المستندات.",
    en: "The issuing authority is required for this document type.",
  },
  {
    test: /DOC_REQUIREMENT_INCOMPLETE/i,
    ar: "أكمل اسم نوع المستند قبل الحفظ.",
    en: "Complete the document type name before saving.",
  },
  {
    test: /DOC_REQUIREMENT_NOT_FOUND/i,
    ar: "نوع المستند غير موجود، ربما حُذف. حدّث الصفحة.",
    en: "This document type no longer exists. Refresh the page.",
  },
  {
    test: /UNKNOWN_DOC_TARGET/i,
    ar: "جهة المستند غير معروفة.",
    en: "Unknown document target.",
  },
  // اشتراط التوثيق قبل النشر والتقديم (قابل للتحكم من لوحة الإدارة)
  {
    test: /FACILITY_NOT_VERIFIED/i,
    ar: "نشر الوظائف والمناوبات متاح للمنشآت الموثّقة فقط. ارفع مستندات منشأتك من صفحة «توثيق المنشأة» وانتظر الاعتماد.",
    en: "Only verified facilities can publish jobs and shifts. Upload your facility documents on the Verification page and wait for approval.",
  },
  {
    test: /PROFESSIONAL_NOT_VERIFIED/i,
    ar: "التقديم على الوظائف وحجز المناوبات متاح للكوادر الموثّقة فقط. ارفع مستنداتك من صفحة «التوثيق» وانتظر الاعتماد.",
    en: "Only verified professionals can apply to jobs and book shifts. Upload your documents on the Verification page and wait for approval.",
  },
  {
    test: /UNKNOWN_SETTING/i,
    ar: "هذا الإعداد غير معروف.",
    en: "Unknown setting.",
  },
  // المرحلة 100: التحقق بخطوتين إلزامي لحسابات الإدارة
  {
    test: /ADMIN_MFA_ENROLLMENT_REQUIRED/i,
    ar: "حسابات الإدارة تتطلب تفعيل التحقق بخطوتين. فعّله من صفحة الأمان ثم أعد المحاولة.",
    en: "Admin accounts require two-factor authentication. Turn it on from the Security page, then try again.",
  },
  {
    test: /MFA_REQUIRED/i,
    ar: "هذه العملية تتطلب تأكيد جلستك برمز التحقق بخطوتين.",
    en: "This action needs your session confirmed with your two-factor code.",
  },
  {
    test: /NOT_ADMIN/i,
    ar: "هذه العملية متاحة لحسابات الإدارة فقط.",
    en: "This action is available to admin accounts only.",
  },
  // المرحلة 83: دورة حياة الدعوة تتبع توفر الفرصة
  {
    test: /INVITATION_TARGET_UNAVAILABLE/i,
    ar: "لم تعد هذه الفرصة متاحة، لذا لا يمكن قبول الدعوة. حدّثنا القائمة لك.",
    en: "This opportunity is no longer available, so the invitation can't be accepted. The list has been refreshed.",
  },
  // المرحلة 82: شارة التوثيق مبنية على أدلة
  {
    test: /VERIFICATION_REQUIREMENTS_NOT_MET/i,
    ar: "لا يمكن منح التوثيق: المستندات المطلوبة غير معتمدة بالكامل. راجع المستندات واعتمدها أولاً.",
    en: "Verification can't be granted: the required documents are not all approved. Review and approve them first.",
  },
  {
    test: /VERIFICATION_SUSPENSION_REASON_REQUIRED/i,
    ar: "اذكر سبب سحب التوثيق (٣ أحرف على الأقل).",
    en: "Give a reason for removing verification (at least 3 characters).",
  },
  // المرحلة 80: اكتمال الملف شرط خادمي قبل الإجراءات التشغيلية
  {
    test: /FACILITY_PROFILE_INCOMPLETE/i,
    ar: "أكمل بيانات منشأتك الأساسية أولاً (الاسم، نوع المنشأة، الدولة، المدينة) ثم أعد المحاولة.",
    en: "Complete your facility's core details first (name, facility type, country, city), then try again.",
  },
  {
    test: /PROFILE_INCOMPLETE/i,
    ar: "أكمل بيانات ملفك الأساسية أولاً (الاسم، التخصص، الدولة، المدينة، سنوات الخبرة) ثم أعد المحاولة.",
    en: "Complete your core profile first (name, specialty, country, city, years of experience), then try again.",
  },
  // المرحلة 79: بوابة التوثيق للبحث عن المرشحين وإلغاء الظهور
  {
    test: /FACILITY_VERIFICATION_REQUIRED/i,
    ar: "البحث عن المرشحين والتواصل الناتج عنه متاح للمنشآت الموثّقة فقط. أكمل توثيق منشأتك أولاً.",
    en: "Candidate search and the contact that follows it are for verified facilities only. Complete your facility verification first.",
  },
  {
    test: /CANDIDATE_NO_LONGER_SEARCHABLE/i,
    ar: "هذا المختص أوقف ظهوره في البحث، فلا يمكن بدء تواصل جديد معه الآن.",
    en: "This professional turned off their search visibility, so new contact isn't possible right now.",
  },
  {
    test: /CANDIDATE_SEARCH_ACCESS_EXPIRED/i,
    ar: "مضت مدة على بحثك الذي وصلت منه لهذا المختص، فلم يعد بالإمكان بدء تواصل جديد. أعد البحث للوصول إليه.",
    en: "Too much time has passed since the search that surfaced this professional. Run the search again to reach them.",
  },
  {
    test: /CANDIDATE_CONTACT_NOT_ALLOWED|CANDIDATE_INVITE_NOT_ALLOWED/i,
    ar: "لا يمكن التواصل مع هذا المختص حالياً. ابحث عنه من جديد أو تابعه من المتقدمين إن كان قد تقدّم لفرصة لديك.",
    en: "You can't contact this professional right now. Search again, or follow up from Applicants if they applied to one of your listings.",
  },
  // حدود التحقق على مستوى قاعدة البيانات (المرحلة 59)
  {
    test: /FULL_NAME_REQUIRED/i,
    ar: "الاسم مطلوب ولا يمكن تركه فارغاً.",
    en: "A name is required and can't be left blank.",
  },
  {
    test: /LOCATION_REQUIRED/i,
    ar: "الدولة والمدينة مطلوبتان.",
    en: "Country and city are required.",
  },
  {
    test: /jobs_title_ck|shifts_title_ck/i,
    ar: "عنوان الفرصة يجب أن يكون بين 3 و120 حرفاً.",
    en: "The listing title must be between 3 and 120 characters.",
  },
  {
    test: /jobs_description_ck/i,
    ar: "وصف الوظيفة يجب أن يكون بين 20 و5000 حرف.",
    en: "The job description must be between 20 and 5000 characters.",
  },
  {
    test: /jobs_salary_ck/i,
    ar: "تحقق من الراتب: لا يقبل قيمة سالبة، والحد الأدنى يجب ألا يتجاوز الحد الأعلى.",
    en: "Check the salary: it can't be negative and the minimum can't exceed the maximum.",
  },
  {
    test: /jobs_vacancies_ck/i,
    ar: "عدد الشواغر يجب أن يكون بين 1 و100.",
    en: "Vacancies must be between 1 and 100.",
  },
  {
    test: /jobs_experience_ck|hp_years_ck/i,
    ar: "سنوات الخبرة يجب أن تكون بين 0 و60.",
    en: "Years of experience must be between 0 and 60.",
  },
  {
    test: /shifts_rate_ck/i,
    ar: "أجر الساعة يجب أن يكون رقماً غير سالب.",
    en: "The hourly rate must be a non-negative number.",
  },
  {
    test: /_currency_ck/i,
    ar: "اختر عملة صحيحة من القائمة.",
    en: "Pick a valid currency from the list.",
  },
  {
    test: /profiles_phone_ck|job_alerts_phone_ck/i,
    ar: "رقم الجوال غير صالح. اكتب من 7 إلى 15 رقماً، مع مقدمة الدولة اختيارياً.",
    en: "That phone number isn't valid. Use 7 to 15 digits, with an optional country prefix.",
  },
  {
    test: /hp_bio_ck|facilities_description_ck|shifts_notes_ck|hp_headline_ck|applications_cover_ck|reviews_comment_ck|pcr_value_ck|credentials_text_ck|facility_documents_text_ck|_name_ck|_text_ck/i,
    ar: "أحد الحقول أطول من المسموح. اختصر النص ثم أعد الحفظ.",
    en: "One of the fields is longer than allowed. Shorten it and save again.",
  },
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
    test: /DELETION_FINALIZER_REQUIRED/i,
    ar: "لا يمكن اعتبار الطلب مكتملاً من هنا؛ الاكتمال يُسجَّل فقط بعد تنفيذ عملية الحذف وإخفاء الهوية الموثوقة.",
    en: "Completion can't be recorded here; it is only set after the trusted deletion and anonymisation process runs.",
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
    test: /ATTACHMENT_NOT_FOUND|ATTACHMENT_NOT_OWNED/i,
    ar: "تعذّر إرفاق الملف. أعد رفعه من جهازك ثم أرسل الرسالة.",
    en: "The file couldn't be attached. Upload it again from your device, then send the message.",
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
 * نص الخطأ الخام أياً كان شكله: `Error`، أو نص، أو كائن أخطاء Supabase/PostgREST
 * (الذي ليس من نوع `Error` ويحمل message/code/details/hint).
 */
function rawText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    return [e["message"], e["code"], e["details"], e["hint"], e["error_description"], e["error"]]
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .join(" · ");
  }
  return "";
}

/**
 * رسالة مفهومة للمستخدم. رسائل `UserFacingError` تُعاد كما هي؛ الأخطاء المعروفة
 * تُترجم؛ وأي خطأ آخر (Supabase/RPC/تخزين) يُسجَّل تقنياً ويُعرض بنص عام.
 */
export function friendlyError(error: unknown, lang: Lang, fallback?: string): string {
  // لا نطبع الخطأ الخام في وحدة التحكم (قد يحمل بيانات مستخدم أو تفاصيل خادم):
  // يُرسل إلى تقارير الأخطاء فقط، ويُعرض للمستخدم نص عام.
  if (error && !(error instanceof UserFacingError)) reportLovableError(error, { source: "handled" });
  if (error instanceof UserFacingError && error.message.trim()) return error.message;

  const raw = rawText(error);
  if (!raw.trim()) return fallback ?? GENERIC[lang];

  for (const rule of RULES) {
    if (rule.test.test(raw)) return rule[lang];
  }
  return fallback ?? GENERIC[lang];
}
