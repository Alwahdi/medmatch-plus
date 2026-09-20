import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function withNoStore(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

/**
 * Cron endpoint that delivers pending browser push notifications.
 *
 *   POST /api/public/push-dispatch
 *   Authorization: Bearer <LOVABLE_CRON_SECRET>
 */
export const Route = createFileRoute("/api/public/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return withNoStore(denied);

        const { dispatchPush } = await import("@/lib/push-dispatch.server");
        try {
          const summary = await dispatchPush();
          return Response.json(summary, { headers: NO_STORE });
        } catch (e) {
          console.error("[push] dispatch failed", e);
          return new Response("Dispatch failed", { status: 500, headers: NO_STORE });
        }
      },
    },
  },
});
