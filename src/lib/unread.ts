import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UnreadMap = Record<string, number>;

/** Unread messages per conversation for the current user (messages sent by the other party). */
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
    void markDelivered(user.id);
    const channelName = `messages-unread-${user.id}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void markDelivered(user.id).then(() => {
          queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);



  const map = query.data ?? {};
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return { map, total };
}

export async function markConversationRead(conversationId: string, userId: string) {
  assertOk(
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null),
  );
}

/** Marks every incoming message as delivered (recipient is online / app is open). */
export async function markDelivered(userId: string) {
  assertOk(
    await supabase
      .from("messages")
      .update({ delivered_at: new Date().toISOString() })
      .neq("sender_id", userId)
      .is("delivered_at", null),
  );
}
