import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint that sends pending job/shift alerts.
 * Protected by the LOVABLE_CRON_SECRET shared secret.
 *
 *   POST /api/public/dispatch-alerts
 *   x-cron-secret: <LOVABLE_CRON_SECRET>
 */
export const Route = createFileRoute("/api/public/dispatch-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["LOVABLE_CRON_SECRET"];
        const provided =
          request.headers.get("x-cron-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!secret || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { dispatchAlerts } = await import("@/lib/alerts-dispatch.server");
        try {
          const summary = await dispatchAlerts();
          return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
        } catch (e) {
          console.error("[alerts] dispatch failed", e);
          return new Response("Dispatch failed", { status: 500 });
        }
      },
    },
  },
});
