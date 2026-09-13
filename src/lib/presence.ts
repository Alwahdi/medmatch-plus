import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks which users are currently online using a shared Supabase presence channel.
 * Every visitor (signed-in or anonymous) joins the same channel and broadcasts a key;
 * signed-in users broadcast their user id so others can see them online.
 */
export function useOnlineUsers(user: User | null | undefined) {
  const [online, setOnline] = useState<Set<string>>(new Set());
  // Anonymous visitors still join the channel (read-only) with a random key.
  const anonKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const key = user?.id ?? anonKey;
    const channel = supabase.channel("online-users", {
      config: { presence: { key } },
    });

    const sync = () => {
      const state = channel.presenceState<{ user_id: string }>();
      const ids = new Set<string>();
      for (const entries of Object.values(state)) {
        for (const entry of entries) if (entry.user_id) ids.add(entry.user_id);
      }
      setOnline(ids);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && user) {
          void channel.track({ user_id: user.id, at: new Date().toISOString() });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, anonKey, user]);

  return online;
}

/** Small online status dot + label, e.g. for profiles and chat headers. */
export function OnlineDotClass(isOnline: boolean) {
  return isOnline ? "bg-emerald-500" : "bg-muted-foreground/40";
}
