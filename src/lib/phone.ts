/**
 * أرقام الجوال: تنظيف محايد لا يفترض دولة بعينها (اليمن والخليج وغيرها).
 * الرقم بيانات حساب خاصة ولا يُعرض ضمن الهوية العامة للمختص أو المنشأة.
 */

/** يبقي الأرقام و«+» في أول الرقم فقط. */
export function normalizePhone(raw: string): string {
  const plus = raw.trim().startsWith("+");
  const digits = raw.replace(/[^0-9]/g, "");
  return (plus ? "+" : "") + digits;
}

/** صيغة دولية معقولة: 7 إلى 15 رقماً مع «+» اختيارية. */
export function isValidPhone(raw: string): boolean {
  return /^\+?[0-9]{7,15}$/.test(normalizePhone(raw));
}

/** نص إرشادي محايد للدول العربية. */
export const PHONE_PLACEHOLDER_AR = "مثال: 771234567 أو ‎+967771234567";
export const PHONE_PLACEHOLDER_EN = "e.g. 771234567 or +967771234567";
