/** ترجمة أخطاء التقديم والحجز القادمة من قاعدة البيانات إلى رسائل مفهومة. */
const MAP: Record<string, { ar: string; en: string }> = {
  APPLICATION_NOT_WITHDRAWABLE: {
    ar: "لا يمكن سحب الطلب بعد صدور قرار المنشأة بشأنه.",
    en: "You can't withdraw an application after the employer's final decision.",
  },
  APPLICATION_WITHDRAWN: {
    ar: "هذا الطلب مسحوب.",
    en: "This application is withdrawn.",
  },
  WITHDRAW_REASON_TOO_LONG: {
    ar: "سبب السحب طويل جداً (الحد 500 حرف).",
    en: "The withdrawal reason is too long (500 characters max).",
  },
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
  SHIFT_HAS_ACTIVE_BOOKING: {
    ar: "هذه المناوبة محجوزة — يجب إلغاء الحجز أولاً.",
    en: "This shift is booked — the booking must be cancelled first.",
  },
  SHIFT_BOOKING_INVARIANT: {
    ar: "حالة المناوبة لا تطابق حجوزاتها، حدّث الصفحة وحاول مجدداً.",
    en: "The shift status doesn't match its bookings. Refresh the page and try again.",
  },
  INVALID_SHIFT_ENGAGEMENT: {
    ar: "يمكن تقييم المناوبة بعد اكتمالها فقط.",
    en: "You can review a shift only after it is completed.",
  },
  ENGAGEMENT_REQUIRED: {
    ar: "التقييم متاح بعد تعامل مكتمل بين الطرفين.",
    en: "Reviews are available after a completed engagement between both sides.",
  },
  UNAUTHENTICATED: { ar: "سجّل الدخول أولاً.", en: "Please sign in first." },
  MFA_REQUIRED: {
    ar: "أكمل التحقق بخطوتين للمتابعة.",
    en: "Complete two-step verification to continue.",
  },
  REPORT_TARGET_NOT_VISIBLE: {
    ar: "لا يمكنك الإبلاغ عن عنصر لا تملك صلاحية الاطلاع عليه.",
    en: "You can't report something you don't have access to.",
  },
  REPORT_QUOTA_EXCEEDED: {
    ar: "وصلت الحد اليومي للبلاغات، حاول غداً.",
    en: "You've reached the daily report limit. Please try tomorrow.",
  },
  REPORT_DETAILS_TOO_LONG: {
    ar: "تفاصيل البلاغ طويلة جداً (الحد 1000 حرف).",
    en: "The report details are too long (1000 characters max).",
  },
  INVALID_REPORT_CATEGORY: {
    ar: "اختر سبباً صحيحاً للبلاغ.",
    en: "Choose a valid report reason.",
  },
  INVALID_REPORT_TARGET: {
    ar: "لا يمكن الإبلاغ عن هذا العنصر.",
    en: "This item can't be reported.",
  },
};

export function engagementErrorText(raw: string | undefined, lang: string): string {
  const ar = lang !== "en";
  const key = Object.keys(MAP).find((k) => (raw ?? "").includes(k));
  if (key) return ar ? MAP[key]!.ar : MAP[key]!.en;
  if ((raw ?? "").includes("duplicate key"))
    return ar ? "سبق أن أرسلت هذا الطلب." : "You already submitted this.";
  return ar ? "تعذّر إتمام الطلب، حاول مرة أخرى." : "Couldn't complete the request, please try again.";
}
