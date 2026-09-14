import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppNotification = {
  id: string;
  type: string;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** Live notifications feed for the signed-in user (all roles). */
export function useNotifications(user: User | null | undefined, limit = 30) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id, limit],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title_ar,title_en,body_ar,body_en,link,read_at,created_at")
        // الرسائل لها عدّاد خاص في صفحة المحادثات، فلا تُعرض هنا
        .neq("type", "message")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(
      `notifications-${user.id}-${Math.random().toString(36).slice(2)}`,
    );
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const items = query.data ?? [];
  return {
    items,
    unreadCount: items.filter((n) => !n.read_at).length,
    isLoading: query.isLoading,
  };
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function clearNotifications(userId: string) {
  await supabase.from("notifications").delete().eq("user_id", userId);
}
