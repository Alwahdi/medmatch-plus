/** ترجمة أخطاء التقديم والحجز القادمة من قاعدة البيانات إلى رسائل مفهومة. */
const MAP: Record<string, { ar: string; en: string }> = {
  PROFESSIONAL_REQUIRED: {
    ar: "هذا الإجراء متاح لحسابات الكوادر الصحية فقط.",
    en: "Only healthcare professional accounts can do this.",
  },
  SHIFT_UNAVAILABLE: {
    ar: "هذه المناوبة لم تعد متاحة — قد يكون شخص آخر حجزها أو بدأ وقتها.",
    en: "This shift is no longer available — it may be booked or already started.",
  },
  JOB_CLOSED: {
    ar: "هذه الوظيفة مغلقة ولم تعد تستقبل طلبات.",
    en: "This job is closed and no longer accepts applications.",
  },
  COVER_TOO_LONG: {
    ar: "نص التقديم طويل جداً (الحد 2000 حرف).",
    en: "Your cover letter is too long (2000 characters max).",
  },
  BOOKING_NOT_CANCELLABLE: {
    ar: "لا يمكن إلغاء الحجز بعد بدء المناوبة.",
    en: "A booking can't be cancelled after the shift has started.",
  },
  SHIFT_NOT_COMPLETABLE: {
    ar: "لا يمكن إنهاء المناوبة قبل انتهاء وقتها.",
    en: "The shift can't be completed before its end time.",
  },
  SHIFT_FINAL_STATE: {
    ar: "هذه المناوبة في حالة نهائية ولا يمكن تغييرها.",
    en: "This shift is in a final state and can't change.",
  },
  INVALID_SHIFT_TRANSITION: {
    ar: "تغيير حالة المناوبة غير مسموح.",
    en: "That shift status change isn't allowed.",
  },
  UNAUTHENTICATED: { ar: "سجّل الدخول أولاً.", en: "Please sign in first." },
};

export function engagementErrorText(raw: string | undefined, lang: string): string {
  const ar = lang !== "en";
  const key = Object.keys(MAP).find((k) => (raw ?? "").includes(k));
  if (key) return ar ? MAP[key]!.ar : MAP[key]!.en;
  if ((raw ?? "").includes("duplicate key"))
    return ar ? "سبق أن أرسلت هذا الطلب." : "You already submitted this.";
  return ar ? "تعذّر إتمام الطلب، حاول مرة أخرى." : "Couldn't complete the request, please try again.";
}
