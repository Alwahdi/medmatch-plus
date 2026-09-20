import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function withNoStore(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

/**
 * Daily maintenance endpoint: recomputes verification badges so a required
 * document that expired by passage of time removes the badge.
 *
 * Auth is the shared cron helper (SHA-256 + timing-safe comparison against
 * LOVABLE_CRON_SECRET, with LOVABLE_CRON_SECRET_PREVIOUS during rotation).
 * The same pass also runs inside /api/public/dispatch-alerts, so an existing
 * alert schedule already keeps badges current; this endpoint exists for an
 * explicit daily run.
 *
 *   POST /api/public/refresh-verification
 *   Authorization: Bearer <LOVABLE_CRON_SECRET>
 */
export const Route = createFileRoute("/api/public/refresh-verification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return withNoStore(denied);

        const { refreshVerificationExpiry } = await import("@/lib/verification-refresh.server");
        try {
          const summary = await refreshVerificationExpiry();
          return Response.json(summary, { headers: NO_STORE });
        } catch (e) {
          console.error("[verification] refresh failed", e);
          return new Response("Refresh failed", { status: 500, headers: NO_STORE });
        }
      },
    },
  },
});
