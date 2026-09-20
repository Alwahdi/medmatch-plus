/**
 * فحص مبدئي في الواجهة لمنع كشف هوية المنشأة داخل نصوص الفرص العامة.
 * المصدر الموثوق للقاعدة هو قاعدة البيانات (LISTING_IDENTITY_DISCLOSURE)؛
 * هذا الفحص فقط لإظهار خطأ مبكر قبل الإرسال.
 */

/** هل يحتوي النص على رابط أو بريد أو رقم تواصل أو اسم المنشأة؟ */
export function hasIdentityDisclosure(text: string, facilityNames: (string | null | undefined)[] = []): boolean {
  const norm = text.replace(/\s+/g, " ").trim().toLowerCase();
  if (!norm) return false;

  if (/(https?:\/\/|www\.)/.test(norm)) return true;
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(norm)) return true;

  // تُزال الفواصل الشائعة ثم يُبحث عن سلسلة أرقام طويلة، حتى لا تُرفض
  // السنوات أو سنوات الخبرة أو قيم الرواتب العادية.
  const digits = norm.replace(/[ \-().]/g, "");
  if (/[0-9]{9,}/.test(digits)) return true;
  if (/\+[0-9]{6,}/.test(digits)) return true;
  if (/(whatsapp|whats app|واتس|واتساب|تلجرام|telegram)/.test(norm) && /[0-9]{7,}/.test(digits)) return true;

  for (const raw of facilityNames) {
    const name = (raw ?? "").replace(/\s+/g, " ").trim().toLowerCase();
    if (name.length >= 3 && norm.includes(name)) return true;
  }
  return false;
}
