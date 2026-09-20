import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { assertOk } from "@/lib/query-errors";
import type { User } from "@supabase/supabase-js";

export type UnreadMap = Record<string, number>;

/**
 * Unread messages per conversation for the current user (messages sent by the
 * other party).
 *
 * Documented fail-soft exception (Phase 73): this drives chrome only — the nav
 * badge and the per-row counters. On a failed request it degrades to "no
 * badge", which is honest chrome (a badge is an additive hint, its absence
 * claims nothing), and it never replaces real content. The messages page
 * itself still surfaces a real error state with retry for the conversation and
 * message lists, so a backend failure is always visible where it matters.
 */
export function useUnread(user: User | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-messages", user?.id],
    enabled: !!user,
    refetchInterval: 20000,
    queryFn: async (): Promise<UnreadMap> => {
      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id")
        .is("read_at", null)
        .neq("sender_id", user!.id);
      if (error) throw error;
      const map: UnreadMap = {};
      for (const row of data ?? []) {
        map[row.conversation_id] = (map[row.conversation_id] ?? 0) + 1;
      }
      return map;
    },
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void markDelivered();

    const refresh = () => {
      if (cancelled) return;
      queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    // Realtime can fire several events in a burst; coalesce them into one RPC.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        void markDelivered().then(refresh);
      }, 600);
    };

    const channelName = `messages-unread-${user.id}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, schedule)
      .subscribe();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);



  const map = query.data ?? {};
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return { map, total };
}

/**
 * Marks the incoming messages of the conversation the user is actually viewing
 * as read. Timestamps are set server-side by a trusted RPC: the sender can
 * never stamp its own message and an existing timestamp is never rewritten.
 */
export async function markConversationRead(conversationId: string) {
  assertOk(await supabase.rpc("mark_conversation_read", { _conversation_id: conversationId }));
}

/** Marks every incoming message as delivered (recipient is online / app is open). */
let deliveredInFlight: Promise<void> | null = null;
export async function markDelivered() {
  // Never let two overlapping calls hit the RPC at once.
  if (deliveredInFlight) return deliveredInFlight;
  deliveredInFlight = (async () => {
    try {
      assertOk(await supabase.rpc("mark_incoming_messages_delivered"));
    } finally {
      deliveredInFlight = null;
    }
  })();
  return deliveredInFlight;
}
