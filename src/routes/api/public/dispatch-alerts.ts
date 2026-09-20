import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function withNoStore(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

/**
 * Cron endpoint that sends pending job/shift alerts.
 *
 * Auth is the shared cron helper: SHA-256 + timing-safe comparison against
 * LOVABLE_CRON_SECRET, with LOVABLE_CRON_SECRET_PREVIOUS accepted during
 * rotation.
 *
 *   POST /api/public/dispatch-alerts
 *   Authorization: Bearer <LOVABLE_CRON_SECRET>
 */
export const Route = createFileRoute("/api/public/dispatch-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return withNoStore(denied);

        const { dispatchAlerts } = await import("@/lib/alerts-dispatch.server");
        try {
          const summary = await dispatchAlerts();
          return Response.json(summary, { headers: NO_STORE });
        } catch (e) {
          // Server-side only: never echo internals (or secrets) to the caller.
          console.error("[alerts] dispatch failed", e);
          return new Response("Dispatch failed", { status: 500, headers: NO_STORE });
        }
      },
    },
  },
});
