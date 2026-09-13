import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  Briefcase,
  Building2,
  CalendarClock,
  Camera,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,

  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Smile,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { RemoteAvatar } from "@/components/remote-avatar";
import { VoiceRecorder } from "@/components/voice-recorder";
import {
  ChatAttachment,
  CHAT_MAX_BYTES,
  formatBytes,
  uploadChatFile,
} from "@/components/chat-attachment";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { formatDateTime, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useOnlineUsers } from "@/lib/presence";
import { markConversationRead, useUnread } from "@/lib/unread";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "الرسائل | SyndeoCare" },
      {
        name: "description",
        content: "تواصل مباشر بين المنشآت الصحية والكوادر الطبية داخل المنصة بعد كشف الهوية.",
      },
      { property: "og:title", content: "الرسائل | SyndeoCare" },
      { property: "og:description", content: "قناة تواصل آمنة بين المنشأة والمرشح." },
    ],
  }),
  component: MessagesPage,
});

type Conversation = {
  id: string;
  facility_id: string;
  professional_user_id: string;
  job_id: string | null;
  shift_id: string | null;
  subject: string | null;
  identity_revealed: boolean;
  last_message_at: string;
};

type Msg = {
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

const EMOJIS = ["👍", "❤️", "😂", "🙏", "👏", "✅"];

const PICKER_EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥳",
  "🙂","😉","😌","😴","🤔","🤗","😇","🙃","😅","😭",
  "😢","😤","😡","👍","👎","👏","🙏","💪","🤝","✌️",
  "👌","🫶","❤️","🔥","⭐","✅","❌","⏰","📅","📎",
  "🩺","💉","🏥","🚑","💊","🧑‍⚕️","📞","✉️","📍","🎉",
];

function dayKey(value: string) {
  return new Date(value).toDateString();
}

function dayLabel(value: string, lang: "ar" | "en", today: string, yesterday: string) {
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

function timeLabel(value: string, lang: "ar" | "en") {
  return new Date(value).toLocaleTimeString(lang === "ar" ? "ar" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TXT = {
  ar: {
    title: "الرسائل",
    sub: "قناة التواصل الرسمية داخل المنصة. تبدأ المنشأة المحادثة، ويظهر اسمها لك فور بدئها.",
    loading: "جارٍ التحميل...",
    emptyTitle: "لا توجد محادثات بعد",
    emptyBody: "ستظهر هنا المحادثات فور تواصل المنشأة معك أو بعد ترقية طلبك في مراحل الفرز.",
    facility: "منشأة صحية",
    hiddenIdentity: "الهوية تظهر عند بدء التواصل",
    professional: "كادر صحي",
    verified: "موثّق",
    aboutJob: "بخصوص وظيفة",
    aboutShift: "بخصوص مناوبة",
    viewPosting: "عرض الإعلان",
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
    online: "متصل الآن",
    offline: "غير متصل",
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
    emptyTitle: "No conversations yet",
    emptyBody: "Conversations appear here once an employer contacts you or your application moves forward in screening.",
    facility: "Healthcare facility",
    hiddenIdentity: "Identity is revealed when contact begins",
    professional: "Healthcare professional",
    verified: "Verified",
    aboutJob: "Regarding job",
    aboutShift: "Regarding shift",
    viewPosting: "View posting",
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

function MessagesPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<Msg | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const uploadAbort = useRef<AbortController | null>(null);
  const [marker, setMarker] = useState<{ convId: string; msgId: string } | null>(null);
  const pendingUnread = useRef<Record<string, number>>({});
  const markerDone = useRef<Record<string, boolean>>({});
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);


  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineUsers = useOnlineUsers(user);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: convs, error } = await supabase
        .from("conversations")
        .select(
          "id,facility_id,professional_user_id,job_id,shift_id,subject,identity_revealed,last_message_at",
        )
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const list = (convs ?? []) as Conversation[];
      const empty = {
        list,
        previews: {} as Record<string, string>,
        facilities: {} as Record<
          string,
          {
            id: string;
            user_id: string | null;
            name_ar: string;
            city: string;
            country: string;
            is_verified: boolean;
            logo_url: string | null;
          }
        >,
        pros: {} as Record<
          string,
          { user_id: string; full_name: string; headline: string | null; is_verified: boolean; avatar_url: string | null }
        >,
        jobs: {} as Record<string, { id: string; title: string; slug: string | null }>,
        shifts: {} as Record<string, { id: string; title: string; starts_at: string }>,
      };
      if (list.length === 0) return empty;

      const [{ data: facilities }, { data: pros }, { data: jobs }, { data: shifts }] =
        await Promise.all([
          supabase
            .from("facilities")
            .select("id,user_id,name_ar,city,country,is_verified,logo_url")
            .in("id", Array.from(new Set(list.map((c) => c.facility_id)))),
          supabase
            .from("healthcare_professionals")
            .select("user_id,full_name,headline,is_verified,avatar_url")
            .in("user_id", Array.from(new Set(list.map((c) => c.professional_user_id)))),
          supabase
            .from("jobs")
            .select("id,title,slug")
            .in("id", list.map((c) => c.job_id).filter(Boolean) as string[]),
          supabase
            .from("shifts")
            .select("id,title,starts_at")
            .in("id", list.map((c) => c.shift_id).filter(Boolean) as string[]),
        ]);

      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("conversation_id,body,attachment_name,attachment_type,created_at")
        .in("conversation_id", list.map((c) => c.id))
        .order("created_at", { ascending: false });
      const previews: Record<string, string> = {};
      for (const m of lastMsgs ?? []) {
        if (!previews[m.conversation_id])
          previews[m.conversation_id] =
            m.body ||
            ((m.attachment_type ?? "").startsWith("audio/")
              ? `🎤 ${c.voiceNote}`
              : `📎 ${m.attachment_name ?? ""}`);
      }

      return {
        ...empty,
        previews,
        facilities: Object.fromEntries((facilities ?? []).map((f) => [f.id, f])),
        pros: Object.fromEntries((pros ?? []).map((p) => [p.user_id, p])),
        jobs: Object.fromEntries((jobs ?? []).map((j) => [j.id, j])),
        shifts: Object.fromEntries((shifts ?? []).map((s) => [s.id, s])),
      };
    },
  });

  const conversations = data?.list ?? [];

  function pickFile(input: HTMLInputElement) {
    const f = input.files?.[0];
    if (!f) return;
    if (f.size > CHAT_MAX_BYTES) {
      toast.error(c.tooBig);
      input.value = "";
      return;
    }
    setFile(f);
  }
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null;
  const { map: unread } = useUnread(user);

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  useEffect(() => {
    if (!active) return;
    const count = unread[active.id] ?? 0;
    if (count > 0 && pendingUnread.current[active.id] === undefined) {
      pendingUnread.current[active.id] = count;
    }
  }, [active, unread]);

  useEffect(() => {
    if (!active || !user || !unread[active.id]) return;
    void markConversationRead(active.id, user.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
    });
  }, [active, user, unread, queryClient]);


  const { data: messages } = useQuery({
    queryKey: ["messages", active?.id],
    enabled: !!active,
    refetchInterval: 15000,
    queryFn: async (): Promise<Msg[]> => {
      const { data: rows, error } = await supabase
        .from("messages")
        .select(
          "id,sender_id,body,created_at,read_at,delivered_at,attachment_path,attachment_name,attachment_type,attachment_size",
        )
        .eq("conversation_id", active!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (rows ?? []) as Msg[];
    },
  });

  const { data: reactions } = useQuery({
    queryKey: ["reactions", active?.id, messages?.length],
    enabled: !!messages?.length,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("message_reactions")
        .select("id,message_id,user_id,emoji")
        .in("message_id", (messages ?? []).map((m) => m.id));
      const map: Record<string, { emoji: string; user_id: string; id: string }[]> = {};
      for (const r of rows ?? []) (map[r.message_id] ??= []).push(r);
      return map;
    },
  });

  // Place the "unread messages" divider before the first message the user has not read.
  useEffect(() => {
    if (!active || !messages) return;
    if (markerDone.current[active.id]) return;
    markerDone.current[active.id] = true;
    const count = pendingUnread.current[active.id] ?? 0;
    if (!count) return;
    const others = messages.filter((m) => m.sender_id !== user?.id);
    const first = others[Math.max(0, others.length - count)];
    if (first) setMarker({ convId: active.id, msgId: first.id });
  }, [active, messages, user]);

  // Open a conversation at its unread divider, otherwise at the newest message.
  useEffect(() => {
    if (!active || !messages?.length) return;
    const id = window.setTimeout(() => {
      if (marker?.convId === active.id && markerRef.current) {
        markerRef.current.scrollIntoView({ block: "center" });
      } else {
        endRef.current?.scrollIntoView({ block: "end" });
      }
      setAtBottom(true);
    }, 30);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, messages?.length === 0]);

  // Follow new messages only when already at the bottom.
  useEffect(() => {
    if (!atBottom) return;
    endRef.current?.scrollIntoView({ block: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function scrollToBottom() {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setAtBottom(true);
  }


  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const mine = (reactions?.[messageId] ?? []).find(
        (r) => r.user_id === user!.id && r.emoji === emoji,
      );
      if (mine) {
        const { error } = await supabase.from("message_reactions").delete().eq("id", mine.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("message_reactions")
          .insert({ message_id: messageId, user_id: user!.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reactions"] }),
    onError: () => toast.error(c.failed),
  });

  const send = useMutation({
    mutationFn: async (voice?: File) => {
      const body = voice ? "" : draft.trim();
      const upload = voice ?? file;
      if (!body && !upload) throw new Error(c.empty);
      if (body.length > 2000) throw new Error(c.tooLong);

      let attachment: Record<string, unknown> = {};
      if (upload) {
        const controller = new AbortController();
        uploadAbort.current = controller;
        setUploadPct(0);
        try {
          const path = await uploadChatFile(active!.id, upload, {
            onProgress: setUploadPct,
            signal: controller.signal,
          });
          attachment = {
            attachment_path: path,
            attachment_name: upload.name,
            attachment_type: upload.type || "application/octet-stream",
            attachment_size: upload.size,
          };
        } finally {
          uploadAbort.current = null;
          setUploadPct(null);
        }
      }

      const { error } = await supabase.from("messages").insert({
        conversation_id: active!.id,
        sender_id: user!.id,
        body,
        ...attachment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      if (imageRef.current) imageRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
      setAtBottom(true);
      queryClient.invalidateQueries({ queryKey: ["messages", active?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => {
      if (e.name === "AbortError") return;
      toast.error(e.message || c.failed);
    },
  });




  function counterpart(conv: Conversation) {
    const isPro = conv.professional_user_id === user?.id;
    if (isPro) {
      const f = data?.facilities?.[conv.facility_id];
      const revealed = conv.identity_revealed && !!f;
      return {
        name: revealed ? f!.name_ar : c.facility,
        sub: f ? [f.city, f.country].filter(Boolean).join("، ") : c.hiddenIdentity,
        verified: f?.is_verified ?? false,
        icon: Building2,
        image: revealed ? f!.logo_url : null,
        kind: "facility" as const,
        linkId: revealed ? conv.facility_id : null,
        online: !!f?.user_id && onlineUsers.has(f.user_id),
      };
    }
    const p = data?.pros?.[conv.professional_user_id];
    return {
      name: p?.full_name ?? c.professional,
      sub: p?.headline ?? "",
      verified: p?.is_verified ?? false,
      icon: UserRound,
      image: p?.avatar_url ?? null,
      kind: "pro" as const,
      linkId: p ? conv.professional_user_id : null,
      online: onlineUsers.has(conv.professional_user_id),
    };
  }

  function startPress(m: Msg) {
    pressTimer.current = setTimeout(() => setInfo(m), 450);
  }
  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  const term = search.trim().toLowerCase();
  const visibleConversations = term
    ? conversations.filter((conv) => {
        const info = counterpart(conv);
        const topic = conv.job_id
          ? data?.jobs?.[conv.job_id]?.title
          : conv.shift_id
            ? data?.shifts?.[conv.shift_id]?.title
            : null;
        return [info.name, info.sub, topic, data?.previews?.[conv.id]]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      })
    : conversations;

  const activeInfo = active ? counterpart(active) : null;
  const activeJob = active?.job_id ? data?.jobs?.[active.job_id] : null;
  const activeShift = active?.shift_id ? data?.shifts?.[active.shift_id] : null;

  const headerBlock = activeInfo && (
    <>
      <span className="relative">
        <RemoteAvatar value={activeInfo.image} icon={activeInfo.icon} className="size-10 rounded-xl" />
        <span
          className={cn(
            "absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-card",
            activeInfo.online ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-bold">
          <span className="truncate">{activeInfo.name}</span>
          {activeInfo.verified && (
            <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
              {c.verified}
            </Badge>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs">
          <span className={activeInfo.online ? "text-emerald-600" : "text-muted-foreground"}>
            {activeInfo.online ? c.online : c.offline}
          </span>
          {activeInfo.linkId && (
            <span className="hidden text-primary underline underline-offset-4 sm:inline">
              {c.viewProfile}
            </span>
          )}
        </span>
      </span>

    </>
  );

  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem)] max-w-6xl flex-col px-0 py-0 sm:px-4 sm:py-6 lg:h-[calc(100dvh-8rem)]">
      <div className="hidden sm:block">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>
      </div>

      {isLoading ? (
        <p className="mt-8 px-4 text-sm text-muted-foreground">{c.loading}</p>
      ) : conversations.length === 0 ? (
        <div className="mt-8 mx-4 rounded-2xl border border-border bg-card p-8 text-center sm:mx-0">
          <p className="font-bold">{c.emptyTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">{c.emptyBody}</p>
        </div>
      ) : (
        <div className="mt-0 grid min-h-0 flex-1 gap-4 sm:mt-6 md:grid-cols-[320px_1fr]">
          <div
            className={cn(
              "min-h-0 flex-col overflow-hidden border-border bg-card sm:rounded-2xl sm:border",
              mobileOpen ? "hidden md:flex" : "flex",
            )}
          >
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={c.searchPh}
                  className="h-10 rounded-full ps-9"
                />
              </div>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain">

              {visibleConversations.length === 0 && (
                <li className="p-6 text-center text-sm text-muted-foreground">{c.noResults}</li>
              )}
              {visibleConversations.map((conv) => {
                const info = counterpart(conv);
                const Icon = info.icon;
                const count = unread[conv.id] ?? 0;
                const topic = conv.job_id
                  ? data?.jobs?.[conv.job_id]?.title
                  : conv.shift_id
                    ? data?.shifts?.[conv.shift_id]?.title
                    : null;
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(conv.id);
                        setMobileOpen(true);
                      }}

                      className={cn(
                        "flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-secondary",
                        active?.id === conv.id && "bg-secondary",
                      )}
                    >
                      <span className="relative shrink-0">
                        <RemoteAvatar value={info.image} icon={Icon} className="size-12 rounded-full" />
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-card",
                            info.online ? "bg-emerald-500" : "bg-muted-foreground/40",
                          )}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-bold">{info.name}</span>
                          {info.verified && <ShieldCheck className="size-3.5 shrink-0 text-accent" />}
                          <span className="ms-auto shrink-0 text-[11px] text-muted-foreground">
                            {relativeTime(conv.last_message_at, lang)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-xs",
                              count > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {data?.previews?.[conv.id] ?? topic ?? info.sub}
                          </span>
                          {count > 0 && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                              {count}
                            </span>
                          )}
                        </span>
                        {topic && (
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                            {conv.job_id ? c.aboutJob : c.aboutShift}: {topic}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {active && activeInfo && (
            <div
              className={cn(
                "min-h-0 flex-col overflow-hidden border-border bg-card sm:rounded-2xl sm:border",
                mobileOpen ? "flex" : "hidden md:flex",
              )}
            >
              <div className="flex items-center gap-2 border-b border-border p-3 sm:p-4">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={c.back}
                  className="size-9 shrink-0 rounded-full md:hidden"
                  onClick={() => setMobileOpen(false)}
                >
                  <ChevronRight className="size-5 rtl:hidden" />
                  <ChevronLeft className="hidden size-5 rtl:block" />
                </Button>
                {activeInfo.linkId ? (
                  activeInfo.kind === "facility" ? (
                    <Link
                      to="/facilities/$facilityId"
                      params={{ facilityId: activeInfo.linkId }}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-secondary"
                      title={c.viewProfile}
                    >
                      {headerBlock}
                    </Link>
                  ) : (
                    <Link
                      to="/facility/candidates/$userId"
                      params={{ userId: activeInfo.linkId }}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-secondary"
                      title={c.viewProfile}
                    >
                      {headerBlock}
                    </Link>
                  )
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3">{headerBlock}</div>
                )}
              </div>

              {(activeJob || activeShift) && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4 sm:py-3">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-semibold sm:text-sm">
                    {activeJob ? (
                      <Briefcase className="size-4 shrink-0 text-primary" />
                    ) : (
                      <CalendarClock className="size-4 shrink-0 text-primary" />
                    )}
                    <span className="hidden text-muted-foreground sm:inline">
                      {activeJob ? c.aboutJob : c.aboutShift}:
                    </span>
                    <span className="truncate">{activeJob ? activeJob.title : activeShift!.title}</span>
                  </span>
                  <Button asChild size="sm" variant="outline" className="ms-auto shrink-0">
                    {activeJob ? (
                      <Link to="/jobs/$jobId" params={{ jobId: activeJob.slug ?? activeJob.id }}>
                        <ExternalLink className="size-3.5" /> {c.viewPosting}
                      </Link>
                    ) : (
                      <Link to="/shifts/$shiftId" params={{ shiftId: activeShift!.id }}>
                        <ExternalLink className="size-3.5" /> {c.viewPosting}
                      </Link>
                    )}
                  </Button>
                </div>
              )}

              <div className="relative min-h-0 flex-1">
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className="h-full space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4"
              >

                {messages?.length ? (
                  messages.map((m, i) => {
                    const mine = m.sender_id === user?.id;
                    const prev = messages[i - 1];
                    const showDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
                    const showUnread = marker?.convId === active.id && marker.msgId === m.id;
                    const list = reactions?.[m.id] ?? [];
                    const grouped = list.reduce<Record<string, number>>((acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                      return acc;
                    }, {});
                    return (
                      <div key={m.id}>
                        {showDay && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm">
                              {dayLabel(m.created_at, lang, c.today, c.yesterday)}
                            </span>
                          </div>
                        )}
                        {showUnread && (
                          <div ref={markerRef} className="my-4 flex items-center gap-3">
                            <span className="h-px flex-1 bg-emerald-500/40" />
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600">
                              {c.unreadDivider}
                            </span>
                            <span className="h-px flex-1 bg-emerald-500/40" />
                          </div>
                        )}

                        <div className={cn("group flex", mine ? "justify-start" : "justify-end")}>
                        <div className="max-w-[88%] min-w-0 sm:max-w-[72%]">
                          <div
                            onPointerDown={() => startPress(m)}
                            onPointerUp={endPress}
                            onPointerLeave={endPress}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setInfo(m);
                            }}
                            className={cn(
                              "select-none space-y-2 rounded-2xl px-3 py-2 text-sm leading-relaxed break-words hyphens-auto whitespace-pre-line shadow-sm sm:px-4 sm:py-3",
                              mine
                                ? "bg-primary text-primary-foreground rounded-ss-sm"
                                : "bg-surface rounded-se-sm",
                            )}
                          >

                            {m.attachment_path && (
                              <ChatAttachment
                                path={m.attachment_path}
                                name={m.attachment_name}
                                type={m.attachment_type}
                                size={m.attachment_size}
                                mine={mine}
                              />
                            )}
                            {m.body}
                            <div
                              className={cn(
                                "mt-1 flex items-center gap-1 text-[10px]",
                                mine ? "opacity-70" : "text-muted-foreground",
                              )}
                            >
                              {timeLabel(m.created_at, lang)}
                              {mine &&
                                (m.read_at ? (
                                  <CheckCheck className="size-3 text-sky-300" />
                                ) : m.delivered_at ? (
                                  <CheckCheck className="size-3" />
                                ) : (
                                  <Check className="size-3" />
                                ))}
                            </div>
                          </div>

                          <div
                            className={cn(
                              "mt-1 flex items-center gap-1",
                              mine ? "justify-start" : "justify-end",
                            )}
                          >
                            {Object.entries(grouped).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => toggleReaction.mutate({ messageId: m.id, emoji })}
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-xs transition",
                                  list.some((r) => r.user_id === user?.id && r.emoji === emoji)
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-card hover:bg-secondary",
                                )}
                              >
                                {emoji} {count > 1 ? count : ""}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setInfo(m)}
                              title={c.react}
                              className="rounded-full border border-border bg-card p-1 text-muted-foreground opacity-0 transition hover:bg-secondary focus:opacity-100 group-hover:opacity-100"
                            >
                              <Smile className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">{c.startChat}</p>
                )}
                <div ref={endRef} />
              </div>
                {!atBottom && (
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    title={c.jumpLatest}
                    aria-label={c.jumpLatest}
                    className="absolute bottom-3 end-3 flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition hover:bg-secondary"
                  >
                    <ArrowDown className="size-5" />
                  </button>
                )}
              </div>

              <div className="shrink-0 border-t border-border bg-card p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3">
                {file && (
                  <div className="mb-2 rounded-2xl border border-border bg-surface p-2">
                    <div className="flex items-center gap-3">
                      {filePreview && file.type.startsWith("image/") ? (
                        <img
                          src={filePreview}
                          alt=""
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : filePreview && file.type.startsWith("video/") ? (
                        <video
                          src={filePreview}
                          className="size-16 shrink-0 rounded-xl bg-black object-cover"
                        />
                      ) : (
                        <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="size-6" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatBytes(file.size)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {uploadPct === null ? c.previewTitle : `${c.uploading} ${uploadPct}%`}
                        </p>
                      </div>

                      {uploadPct !== null ? (
                        <button
                          type="button"
                          title={c.cancelUpload}
                          aria-label={c.cancelUpload}
                          onClick={() => uploadAbort.current?.abort()}
                          className="relative flex size-11 shrink-0 items-center justify-center"
                        >
                          <svg viewBox="0 0 36 36" className="absolute inset-0 size-11 -rotate-90">
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              strokeWidth="3"
                              className="stroke-border"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              strokeWidth="3"
                              strokeLinecap="round"
                              className="stroke-primary transition-[stroke-dashoffset]"
                              strokeDasharray={Math.PI * 32}
                              strokeDashoffset={Math.PI * 32 * (1 - uploadPct / 100)}
                            />
                          </svg>
                          <X className="size-4 text-muted-foreground" />
                        </button>
                      ) : (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={c.cancelRec}
                            aria-label={c.cancelRec}
                            className="size-9 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setFile(null);
                              if (fileRef.current) fileRef.current.value = "";
                              if (imageRef.current) imageRef.current.value = "";
                              if (cameraRef.current) cameraRef.current.value = "";
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            title={c.confirmSend}
                            aria-label={c.confirmSend}
                            className="size-9 rounded-full"
                            disabled={send.isPending}
                            onClick={() => send.mutate(undefined)}
                          >
                            <Send className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                <div className="flex items-end gap-1.5">
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title={c.emoji}
                        aria-label={c.emoji}
                        className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Smile className="size-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(20rem,92vw)] p-2">
                      <div className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto sm:grid-cols-10">

                        {PICKER_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setDraft((d) => `${d}${emoji}`)}
                            className="rounded-md p-1 text-lg transition hover:bg-secondary"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title={c.attach}
                        aria-label={c.attach}
                        disabled={send.isPending}
                        className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Paperclip className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuItem onSelect={() => imageRef.current?.click()}>
                        <ImageIcon className="size-4 text-primary" /> {c.photo}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => cameraRef.current?.click()}>
                        <Camera className="size-4 text-emerald-600" /> {c.camera}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                        <FileText className="size-4 text-sky-600" /> {c.document}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Textarea
                    rows={1}
                    maxLength={2000}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if ((draft.trim() || file) && !send.isPending) send.mutate(undefined);
                      }
                    }}
                    placeholder={c.placeholder}
                    className="max-h-36 min-h-10 flex-1 resize-none rounded-2xl py-2.5"
                  />

                  {draft.trim() || file ? (
                    <Button
                      type="button"
                      size="icon"
                      title={c.send}
                      aria-label={c.send}
                      onClick={() => send.mutate(undefined)}
                      disabled={send.isPending}
                      className="size-10 shrink-0 rounded-full"
                    >
                      {send.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  ) : (
                    <VoiceRecorder
                      compact
                      disabled={send.isPending}
                      labels={{
                        record: c.record,
                        stop: c.stop,
                        cancel: c.cancelRec,
                        unsupported: c.micUnsupported,
                        denied: c.micDenied,
                      }}
                      onRecorded={(f) => send.mutate(f)}
                    />
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={(e) => pickFile(e.target)}
                  />
                  <input
                    ref={imageRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={(e) => pickFile(e.target)}
                  />
                  <input
                    ref={cameraRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => pickFile(e.target)}
                  />
                </div>

                <div className="mt-1.5 hidden items-center gap-3 px-1 sm:flex">
                  <span className="truncate text-[11px] text-muted-foreground">{c.hint}</span>
                  <span className="ms-auto shrink-0 text-[11px] text-muted-foreground">
                    {draft.length}/2000
                  </span>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!info} onOpenChange={(o) => !o && setInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.infoTitle}</DialogTitle>
            <DialogDescription>{c.infoSub}</DialogDescription>
          </DialogHeader>
          {info && (
            <div className="space-y-4">
              <div className="rounded-xl bg-surface p-3 text-sm whitespace-pre-line">
                {info.body || (info.attachment_type?.startsWith("audio/") ? c.voiceNote : info.attachment_name)}
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{c.sentAt}</dt>
                  <dd>{formatDateTime(info.created_at, lang)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{c.deliveredAt}</dt>
                  <dd>{info.delivered_at ? formatDateTime(info.delivered_at, lang) : c.notYet}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{c.readAt}</dt>
                  <dd>{info.read_at ? formatDateTime(info.read_at, lang) : c.notYet}</dd>
                </div>
              </dl>
              <div>
                <p className="text-sm font-bold">{c.reactions}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        toggleReaction.mutate({ messageId: info.id, emoji });
                        setInfo(null);
                      }}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-lg transition hover:bg-secondary"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
