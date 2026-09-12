import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  Paperclip,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RemoteAvatar } from "@/components/remote-avatar";
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
    hint: "اضغط Enter للإرسال، وShift+Enter لسطر جديد",
    attach: "إرفاق ملف",
    tooBig: "حجم الملف يجب ألا يتجاوز 10 ميغابايت",
    attachment: "مرفق",
    uploading: "جارٍ رفع الملف...",
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
    hint: "Press Enter to send, Shift+Enter for a new line",
    attach: "Attach file",
    tooBig: "File must be 10MB or smaller",
    attachment: "Attachment",
    uploading: "Uploading file...",
  },
} as const;

function MessagesPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

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
          { id: string; name_ar: string; city: string; country: string; is_verified: boolean; logo_url: string | null }
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
            .select("id,name_ar,city,country,is_verified,logo_url")
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
        .select("conversation_id,body,attachment_name,created_at")
        .in("conversation_id", list.map((c) => c.id))
        .order("created_at", { ascending: false });
      const previews: Record<string, string> = {};
      for (const m of lastMsgs ?? []) {
        if (!previews[m.conversation_id])
          previews[m.conversation_id] = m.body || `📎 ${m.attachment_name ?? ""}`;
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
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null;
  const { map: unread } = useUnread(user);

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

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
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("messages")
        .select(
          "id,sender_id,body,created_at,read_at,attachment_path,attachment_name,attachment_type,attachment_size",
        )
        .eq("conversation_id", active!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return rows ?? [];
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async () => {
      const body = draft.trim();
      if (!body && !file) throw new Error(c.empty);
      if (body.length > 2000) throw new Error(c.tooLong);

      let attachment: {
        attachment_path: string;
        attachment_name: string;
        attachment_type: string;
        attachment_size: number;
      } | null = null;
      if (file) {
        const path = await uploadChatFile(active!.id, file);
        attachment = {
          attachment_path: path,
          attachment_name: file.name,
          attachment_type: file.type || "application/octet-stream",
          attachment_size: file.size,
        };
      }

      const { error } = await supabase.from("messages").insert({
        conversation_id: active!.id,
        sender_id: user!.id,
        body,
        ...(attachment ?? {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["messages", active?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message || c.failed),
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
    };
  }


  const activeInfo = active ? counterpart(active) : null;
  const activeJob = active?.job_id ? data?.jobs?.[active.job_id] : null;
  const activeShift = active?.shift_id ? data?.shifts?.[active.shift_id] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">{c.loading}</p>
      ) : conversations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-bold">{c.emptyTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">{c.emptyBody}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-[320px_1fr]">
          <ul className="space-y-2">
            {conversations.map((conv) => {
              const info = counterpart(conv);
              const Icon = info.icon;
              return (
                <li key={conv.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(conv.id)}
                    className={cn(
                      "w-full rounded-2xl border border-border bg-card p-4 text-start transition-colors hover:bg-secondary",
                      active?.id === conv.id && "border-primary bg-secondary",
                    )}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <RemoteAvatar
                        value={info.image}
                        icon={Icon}
                        className="size-8 shrink-0 rounded-xl"
                      />
                      <span className="truncate">{info.name}</span>
                      {info.verified && <ShieldCheck className="size-3.5 shrink-0 text-accent" />}
                      {(unread[conv.id] ?? 0) > 0 && (
                        <span className="ms-auto rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
                          {unread[conv.id]}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {conv.job_id
                        ? data?.jobs?.[conv.job_id]?.title ?? info.sub
                        : conv.shift_id
                          ? data?.shifts?.[conv.shift_id]?.title ?? info.sub
                          : info.sub}
                    </span>
                    {data?.previews?.[conv.id] && (
                      <span
                        className={cn(
                          "mt-1 block truncate text-xs",
                          (unread[conv.id] ?? 0) > 0
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {data.previews[conv.id]}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {relativeTime(conv.last_message_at, lang)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {active && activeInfo && (
            <div className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                {activeInfo.linkId ? (
                  activeInfo.kind === "facility" ? (
                    <Link
                      to="/facilities/$facilityId"
                      params={{ facilityId: activeInfo.linkId }}
                      className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-secondary"
                      title={c.viewProfile}
                    >
                      <RemoteAvatar
                        value={activeInfo.image}
                        icon={activeInfo.icon}
                        className="size-10 rounded-xl"
                      />
                      <span>
                        <span className="flex items-center gap-2 font-bold">
                          {activeInfo.name}
                          {activeInfo.verified && <Badge variant="secondary">{c.verified}</Badge>}
                        </span>
                        <span className="block text-xs text-primary underline underline-offset-4">
                          {c.viewProfile}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to="/facility/candidates/$userId"
                      params={{ userId: activeInfo.linkId }}
                      className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-secondary"
                      title={c.viewProfile}
                    >
                      <RemoteAvatar
                        value={activeInfo.image}
                        icon={activeInfo.icon}
                        className="size-10 rounded-xl"
                      />
                      <span>
                        <span className="flex items-center gap-2 font-bold">
                          {activeInfo.name}
                          {activeInfo.verified && <Badge variant="secondary">{c.verified}</Badge>}
                        </span>
                        <span className="block text-xs text-primary underline underline-offset-4">
                          {c.viewProfile}
                        </span>
                      </span>
                    </Link>
                  )
                ) : (

                  <div className="flex items-center gap-3">
                    <RemoteAvatar value={null} icon={activeInfo.icon} className="size-10 rounded-xl" />
                    <span>
                      <span className="flex items-center gap-2 font-bold">{activeInfo.name}</span>
                      <span className="block text-xs text-muted-foreground">{activeInfo.sub}</span>
                    </span>
                  </div>
                )}
              </div>

              {(activeJob || activeShift) && (
                <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {activeJob ? (
                      <Briefcase className="size-4 text-primary" />
                    ) : (
                      <CalendarClock className="size-4 text-primary" />
                    )}
                    <span className="text-muted-foreground">
                      {activeJob ? c.aboutJob : c.aboutShift}:
                    </span>
                    {activeJob ? activeJob.title : activeShift!.title}
                  </span>
                  <Button asChild size="sm" variant="outline" className="ms-auto">
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

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages?.length ? (
                  messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[80%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                            mine ? "bg-primary text-primary-foreground" : "bg-surface",
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
                            {formatDateTime(m.created_at, lang)}
                            {mine &&
                              (m.read_at ? (
                                <CheckCheck className="size-3" />
                              ) : (
                                <Check className="size-3" />
                              ))}
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

              <div className="border-t border-border p-4">
                {file && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs">
                    <Paperclip className="size-3.5 text-primary" />
                    <span className="truncate font-semibold">{file.name}</span>
                    <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      className="ms-auto text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setFile(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if ((draft.trim() || file) && !send.isPending) send.mutate();
                    }
                  }}
                  placeholder={c.placeholder}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => send.mutate()}
                    disabled={send.isPending || (!draft.trim() && !file)}
                  >
                    {send.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {send.isPending ? (file ? c.uploading : c.sending) : c.send}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={send.isPending}
                  >
                    <Paperclip className="size-4" /> {c.attach}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > CHAT_MAX_BYTES) {
                        toast.error(c.tooBig);
                        e.target.value = "";
                        return;
                      }
                      setFile(f);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{c.hint}</span>
                  <span className="ms-auto text-xs text-muted-foreground">{draft.length}/2000</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
