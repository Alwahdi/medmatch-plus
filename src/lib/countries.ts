/**
 * المرجع الوحيد للدول في المنصة (المرحلة 102).
 *
 * كل دولة: رمز ISO، والقيمة العربية المعتمدة المخزّنة في قاعدة البيانات
 * (`stored`)، والاسمان العربي والإنجليزي للعرض، ومرادفات قديمة تُطبَّع إلى
 * القيمة المعتمدة (أسماء رسمية طويلة، رموز ISO، كتابات بلا تشكيل).
 *
 * التخزين يبقى بالاسم العربي المعتمد في هذا الإصدار — لا انتقال إلى رموز ISO
 * في قاعدة البيانات — حتى لا نكسر الفلاتر والروابط المحفوظة.
 */

export type CountryEntry = {
  code: string;
  /** القيمة المعتمدة المخزّنة في قاعدة البيانات */
  stored: string;
  ar: string;
  en: string;
  aliases: string[];
};

export const CANONICAL_COUNTRIES: CountryEntry[] = [
  { code: "YE", stored: "اليمن", ar: "اليمن", en: "Yemen", aliases: ["الجمهورية اليمنية"] },
  {
    code: "SA",
    stored: "السعودية",
    ar: "السعودية",
    en: "Saudi Arabia",
    aliases: ["المملكة العربية السعودية", "KSA"],
  },
  {
    code: "AE",
    stored: "الإمارات",
    ar: "الإمارات",
    en: "United Arab Emirates",
    aliases: ["الإمارات العربية المتحدة", "UAE"],
  },
  { code: "EG", stored: "مصر", ar: "مصر", en: "Egypt", aliases: ["جمهورية مصر العربية"] },
  { code: "KW", stored: "الكويت", ar: "الكويت", en: "Kuwait", aliases: ["دولة الكويت"] },
  { code: "QA", stored: "قطر", ar: "قطر", en: "Qatar", aliases: ["دولة قطر"] },
  { code: "JO", stored: "الأردن", ar: "الأردن", en: "Jordan", aliases: ["المملكة الأردنية الهاشمية"] },
  { code: "BH", stored: "البحرين", ar: "البحرين", en: "Bahrain", aliases: ["مملكة البحرين"] },
  { code: "OM", stored: "عُمان", ar: "عُمان", en: "Oman", aliases: ["عمان", "سلطنة عمان", "سلطنة عُمان"] },
  { code: "MA", stored: "المغرب", ar: "المغرب", en: "Morocco", aliases: ["المملكة المغربية"] },
  { code: "DZ", stored: "الجزائر", ar: "الجزائر", en: "Algeria", aliases: [] },
  { code: "TN", stored: "تونس", ar: "تونس", en: "Tunisia", aliases: [] },
  { code: "IQ", stored: "العراق", ar: "العراق", en: "Iraq", aliases: ["جمهورية العراق"] },
  { code: "LB", stored: "لبنان", ar: "لبنان", en: "Lebanon", aliases: [] },
  { code: "SY", stored: "سوريا", ar: "سوريا", en: "Syria", aliases: ["سورية", "الجمهورية العربية السورية"] },
  { code: "PS", stored: "فلسطين", ar: "فلسطين", en: "Palestine", aliases: ["دولة فلسطين"] },
  { code: "SD", stored: "السودان", ar: "السودان", en: "Sudan", aliases: ["جمهورية السودان"] },
  { code: "LY", stored: "ليبيا", ar: "ليبيا", en: "Libya", aliases: ["دولة ليبيا"] },
];

/** قائمة القيم المعتمدة كما تُخزَّن في قاعدة البيانات. */
export const STORED_COUNTRIES = CANONICAL_COUNTRIES.map((c) => c.stored);

export const DEFAULT_COUNTRY = "اليمن";

/** توحيد الكتابة قبل المطابقة: تشكيل، تطويل، همزات، مسافات، حالة الأحرف. */
function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622]/g, "\u0627")
    .replace(/\s+/g, " ");
}

const BY_KEY = new Map<string, CountryEntry>();
for (const entry of CANONICAL_COUNTRIES) {
  for (const key of [entry.code, entry.stored, entry.ar, entry.en, ...entry.aliases]) {
    BY_KEY.set(norm(key), entry);
  }
}

/** إدخال الدولة المطابق لأي قيمة معروفة (معتمدة أو مرادف أو رمز)، وإلا null. */
export function countryEntry(value: string | null | undefined): CountryEntry | null {
  if (!value) return null;
  return BY_KEY.get(norm(value)) ?? null;
}

export function countryCodeOf(value: string | null | undefined): string | null {
  return countryEntry(value)?.code ?? null;
}

/**
 * القيمة المعتمدة للتخزين/المقارنة. الدول غير المعروفة تُعاد كما هي بعد إزالة
 * المسافات الزائدة فقط — لا نغيّر نصاً كتبه المستخدم ولا نحذفه.
 */
export function canonicalCountry(value: string | null | undefined): string {
  if (!value) return "";
  return countryEntry(value)?.stored ?? value.trim();
}

/** اسم الدولة للعرض بلغة الواجهة، مع دعم كل المرادفات والرموز. */
export function countryDisplay(value: string | null | undefined, lang: "ar" | "en" = "ar"): string {
  if (!value) return "";
  const entry = countryEntry(value);
  if (!entry) return value.trim();
  return lang === "en" ? entry.en : entry.ar;
}
