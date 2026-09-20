/** نصوص وأنواع ومساعدات شاشة الرسائل — وحدة واحدة مشتركة. */
export type Conversation = {
  id: string;
  facility_id: string;
  professional_user_id: string;
  job_id: string | null;
  shift_id: string | null;
  subject: string | null;
  identity_revealed: boolean;
  last_message_at: string;
};

export type Msg = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
};

export const EMOJIS = ["👍", "❤️", "😂", "🙏", "👏", "✅"];

export const PICKER_EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥳",
  "🙂","😉","😌","😴","🤔","🤗","😇","🙃","😅","😭",
  "😢","😤","😡","👍","👎","👏","🙏","💪","🤝","✌️",
  "👌","🫶","❤️","🔥","⭐","✅","❌","⏰","📅","📎",
  "🩺","💉","🏥","🚑","💊","🧑‍⚕️","📞","✉️","📍","🎉",
];

export function dayKey(value: string) {
  return new Date(value).toDateString();
}

export function dayLabel(value: string, lang: "ar" | "en", today: string, yesterday: string) {
  const key = dayKey(value);
  const now = new Date();
  if (key === now.toDateString()) return today;
  const y = new Date(now.getTime() - 86400000);
  if (key === y.toDateString()) return yesterday;
  return new Date(value).toLocaleDateString(lang === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function timeLabel(value: string, lang: "ar" | "en") {
  return new Date(value).toLocaleTimeString(lang === "ar" ? "ar" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const TXT = {
  ar: {
    title: "الرسائل",
    sub: "قناة التواصل الرسمية داخل المنصة. تبدأ المنشأة المحادثة، ويظهر اسمها لك فور بدئها.",
    loading: "جارٍ التحميل...",
    loadFailed: "تعذّر تحميل المحادثات",
    retry: "إعادة المحاولة",
    emptyTitle: "لا توجد محادثات بعد",
    emptyBody: "ستظهر هنا المحادثات فور تواصل المنشأة معك أو عند انتقال طلبك إلى مرحلة تواصل.",
    facility: "منشأة صحية",
    hiddenIdentity: "الهوية تظهر عند بدء التواصل",
    professional: "كادر صحي",
    verified: "موثّق",
    aboutJob: "بخصوص وظيفة",
    aboutShift: "بخصوص مناوبة",
    viewPosting: "عرض الفرصة",
    viewProfile: "عرض الملف العام",
    startChat: "ابدأ المحادثة برسالة تعريفية.",
    placeholder: "اكتب رسالتك...",
    sending: "جارٍ الإرسال...",
    send: "إرسال",
    empty: "اكتب رسالة أو أرفق ملفاً",
    tooLong: "الرسالة طويلة جداً",
    failed: "تعذّر إرسال الرسالة",
    hint: "اضغط Enter للإرسال، واضغط مطوّلاً على أي رسالة لعرض التفاصيل والتفاعل",
    attach: "إرفاق ملف",
    tooBig: "حجم الملف يجب ألا يتجاوز 10 ميغابايت",
    uploading: "جارٍ الرفع...",
    voiceNote: "رسالة صوتية",
    record: "تسجيل صوتي",
    stop: "إيقاف وإرسال",
    cancelRec: "إلغاء",
    micUnsupported: "المتصفح لا يدعم التسجيل الصوتي",
    micDenied: "تعذّر الوصول إلى الميكروفون",
    infoTitle: "تفاصيل الرسالة",
    infoSub: "أوقات الإرسال والاستلام والقراءة",
    sentAt: "أُرسلت",
    deliveredAt: "وصلت",
    readAt: "قُرئت",
    notYet: "لم يتم بعد",
    react: "تفاعل",
    reactions: "التفاعلات",
    searchPh: "ابحث في المحادثات",
    noResults: "لا توجد نتائج مطابقة",
    photo: "صورة أو فيديو",
    camera: "التقاط صورة",
    document: "مستند",
    emoji: "إيموجي",
    today: "اليوم",
    yesterday: "أمس",
    you: "أنت:",
    back: "رجوع",
    unreadDivider: "رسائل غير مقروءة",
    jumpLatest: "أحدث الرسائل",
    pause: "إيقاف مؤقت",
    resume: "متابعة التسجيل",
    paused: "التسجيل متوقف مؤقتاً",
    sendNow: "إرسال",
    cancelUpload: "إلغاء الرفع",
    previewTitle: "معاينة قبل الإرسال",
    confirmSend: "تأكيد الإرسال",



  },
  en: {
    title: "Messages",
    sub: "The official in-platform channel. The employer starts the conversation, and their name is revealed to you as soon as they do.",
    loading: "Loading...",
    loadFailed: "Could not load conversations",
    retry: "Try again",
    emptyTitle: "No conversations yet",
    emptyBody: "Conversations appear here once an employer contacts you or your application moves forward in screening.",
    facility: "Healthcare facility",
    hiddenIdentity: "Identity is revealed when contact begins",
    professional: "Healthcare professional",
    verified: "Verified",
    aboutJob: "Regarding job",
    aboutShift: "Regarding shift",
    viewPosting: "View opportunity",
    viewProfile: "View public profile",
    startChat: "Start the conversation with a short introduction.",
    placeholder: "Write your message...",
    sending: "Sending...",
    send: "Send",
    empty: "Write a message or attach a file",
    tooLong: "Message is too long",
    failed: "Could not send the message",
    hint: "Press Enter to send. Long-press a message for details and reactions",
    attach: "Attach file",
    tooBig: "File must be 10MB or smaller",
    uploading: "Uploading...",
    online: "Online",
    offline: "Offline",
    voiceNote: "Voice note",
    record: "Record voice",
    stop: "Stop & send",
    cancelRec: "Cancel",
    micUnsupported: "This browser does not support recording",
    micDenied: "Microphone access was denied",
    infoTitle: "Message details",
    infoSub: "Sent, delivered and read times",
    sentAt: "Sent",
    deliveredAt: "Delivered",
    readAt: "Read",
    notYet: "Not yet",
    react: "React",
    reactions: "Reactions",
    searchPh: "Search conversations",
    noResults: "No matching conversations",
    photo: "Photo or video",
    camera: "Take a photo",
    document: "Document",
    emoji: "Emoji",
    today: "Today",
    yesterday: "Yesterday",
    you: "You:",
    back: "Back",
    unreadDivider: "Unread messages",
    jumpLatest: "Latest messages",
    pause: "Pause",
    resume: "Resume",
    paused: "Recording paused",
    sendNow: "Send",
    cancelUpload: "Cancel upload",
    previewTitle: "Preview before sending",
    confirmSend: "Confirm send",



  },
} as const;

