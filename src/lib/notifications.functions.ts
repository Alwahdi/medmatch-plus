import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Tells the UI whether the email / WhatsApp providers can actually deliver
 * proactive job/shift alerts (WhatsApp also needs an approved template).
 */
export const getChannelStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { alertChannelStatus } = await import("./notify.server");
    return alertChannelStatus();
  });
