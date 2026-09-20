/**
 * أدوات صغيرة تمنع الخلط بين "لا توجد نتائج" و"فشل الطلب".
 *
 * قاعدة المنتج: أي استعلام بيانات فعلية يجب أن يرمي عند وجود `error` حتى تعرض
 * الواجهة `ErrorState` بدل حالة فارغة كاذبة (0 وظيفة / لا رسائل / لا إشعارات).
 * الاستثناء الوحيد المسموح هو بحث تجميلي بحت يبقى بديله في الواجهة صادقاً
 * (مثل رابط صورة موقّت يعود null فيظهر الحرف الأول بدل الصورة).
 */

type Failure = { message: string; code?: string; status?: number } | null;
type Ok<T> = { data: T; error: Failure };

/** يعيد الصف (أو null إذا لم يوجد فعلاً) ويرمي إذا فشل الطلب. */
export function unwrap<R extends Ok<unknown>>(res: R): R["data"] {
  if (res.error) throw res.error;
  return res.data;
}

/** يعيد القائمة ويرمي إذا فشل الطلب — قائمة فارغة تعني فعلاً لا نتائج. */
export function unwrapRows<R extends Ok<unknown[] | null>>(res: R): Exclude<R["data"], null> {
  if (res.error) throw res.error;
  return (res.data ?? []) as Exclude<R["data"], null>;
}

/** يعيد العدد ويرمي إذا فشل الطلب — حتى لا يظهر 0 كاذب في بطاقات الإحصاء. */
export function unwrapCount(res: { count: number | null; error: Failure }): number {
  if (res.error) throw res.error;
  return res.count ?? 0;
}

/** للعمليات التي لا تُرجع بيانات (تحديث/حذف/RPC): ترمي عند الفشل. */
export function assertOk(res: { error: Failure }): void {
  if (res.error) throw res.error;
}
