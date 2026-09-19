import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Tells the UI whether the email / WhatsApp providers are configured yet. */
export const getChannelStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { channelStatus } = await import("./notify.server");
    return channelStatus();
  });
