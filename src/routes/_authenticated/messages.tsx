import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, Send, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { formatDateTime, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
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
    about: (t: string) => `بخصوص وظيفة: ${t}`,
    startChat: "ابدأ المحادثة برسالة تعريفية.",
    placeholder: "اكتب رسالتك...",
    sending: "جارٍ الإرسال...",
    send: "إرسال",
    empty: "اكتب رسالتك أولاً",
    tooLong: "الرسالة طويلة جداً",
    failed: "تعذّر إرسال الرسالة",
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
    about: (t: string) => `Regarding job: ${t}`,
    startChat: "Start the conversation with a short introduction.",
    placeholder: "Write your message...",
    sending: "Sending...",
    send: "Send",
    empty: "Write your message first",
    tooLong: "Message is too long",
    failed: "Could not send the message",
  },
} as const;

function MessagesPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: convs, error } = await supabase
        .from("conversations")
        .select("id,facility_id,professional_user_id,job_id,subject,identity_revealed,last_message_at")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const list = (convs ?? []) as Conversation[];
      if (list.length === 0) return { list, facilities: {}, pros: {}, jobs: {} };

      const [{ data: facilities }, { data: pros }, { data: jobs }] = await Promise.all([
        supabase
          .from("facilities")
          .select("id,name_ar,city,country,is_verified")
          .in("id", Array.from(new Set(list.map((c) => c.facility_id)))),
        supabase
          .from("healthcare_professionals")
          .select("user_id,full_name,headline,is_verified")
          .in("user_id", Array.from(new Set(list.map((c) => c.professional_user_id)))),
        supabase
          .from("jobs")
          .select("id,title")
          .in("id", list.map((c) => c.job_id).filter(Boolean) as string[]),
      ]);

      return {
        list,
        facilities: Object.fromEntries((facilities ?? []).map((f) => [f.id, f])),
        pros: Object.fromEntries((pros ?? []).map((p) => [p.user_id, p])),
        jobs: Object.fromEntries((jobs ?? []).map((j) => [j.id, j])),
      };
    },
  });

  const conversations = data?.list ?? [];
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null;

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  const { data: messages } = useQuery({
    queryKey: ["messages", active?.id],
    enabled: !!active,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("messages")
        .select("id,sender_id,body,created_at")
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
      if (!body) throw new Error(c.empty);
      if (body.length > 2000) throw new Error(c.tooLong);
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: active!.id, sender_id: user!.id, body });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", active?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message || c.failed),
  });

  function counterpart(conv: Conversation) {
    const isPro = conv.professional_user_id === user?.id;
    if (isPro) {
      const f = data?.facilities?.[conv.facility_id];
      return {
        name: conv.identity_revealed && f ? f.name_ar : c.facility,
        sub: f ? [f.city, f.country].filter(Boolean).join("، ") : c.hiddenIdentity,
        verified: f?.is_verified ?? false,
        icon: Building2,
      };
    }
    const p = data?.pros?.[conv.professional_user_id];
    return {
      name: p?.full_name ?? c.professional,
      sub: p?.headline ?? "",
      verified: p?.is_verified ?? false,
      icon: UserRound,
    };
  }

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
                      <Icon className="size-4 text-primary" />
                      {info.name}
                      {info.verified && <ShieldCheck className="size-3.5 text-accent" />}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {conv.job_id ? data?.jobs?.[conv.job_id]?.title ?? info.sub : info.sub}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {relativeTime(conv.last_message_at, lang)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {active && (
            <div className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <p className="flex items-center gap-2 font-bold">
                  {counterpart(active).name}
                  {counterpart(active).verified && <Badge variant="secondary">{c.verified}</Badge>}
                </p>
                {active.job_id && data?.jobs?.[active.job_id] && (
                  <p className="text-xs text-muted-foreground">
                    {c.about(data.jobs[active.job_id]!.title)}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages?.length ? (
                  messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                            mine ? "bg-primary text-primary-foreground" : "bg-surface",
                          )}
                        >
                          {m.body}
                          <div className={cn("mt-1 text-[10px]", mine ? "opacity-70" : "text-muted-foreground")}>
                            {formatDateTime(m.created_at, lang)}
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
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={c.placeholder}
                />
                <Button className="mt-3" onClick={() => send.mutate()} disabled={send.isPending}>
                  <Send className="size-4" /> {send.isPending ? c.sending : c.send}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
