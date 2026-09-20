/**
 * الحدود الرسمية لحقول الملف المهني — مصدر واحد تشترك فيه:
 * - قيود قاعدة البيانات (hp_full_name_ck, hp_headline_ck, hp_bio_ck, hp_place_ck, hp_license_ck, hp_years_ck)
 * - نموذج الملف المهني في الواجهة (/profile)
 * - مخرجات محلّل السيرة الذاتية بالذكاء الاصطناعي
 * أي تعديل هنا يجب أن يقابله تعديل مطابق في قيود قاعدة البيانات.
 */
export const PROFILE_LIMITS = {
  fullName: 100,
  headline: 150,
  bio: 1500,
  country: 60,
  city: 60,
  licenseCountry: 60,
  licenseNumber: 60,
  specialtyHint: 80,
  yearsMin: 0,
  yearsMax: 60,
} as const;
