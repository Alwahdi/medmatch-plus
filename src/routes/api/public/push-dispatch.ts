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
 *
 * The database-scheduled caller (pg_cron + pg_net) cannot read server env
 * secrets, so it authenticates with a token stored in the private
 * public.cron_tokens table (no grants — service role only).
 */
async function authenticateDbToken(request: Request): Promise<boolean> {
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  if (!match) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // cron_tokens is intentionally absent from the generated types (private table).
  const client = supabaseAdmin as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c2: string, v: string) => { maybeSingle: () => Promise<{ data: { token?: string } | null }> };
      };
    };
  };
  const { data } = await client.from("cron_tokens").select("token").eq("name", "push_dispatch").maybeSingle();
  const stored = data?.token;
  if (!stored) return false;
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(match[1]!), digest(stored));
}
export const Route = createFileRoute("/api/public/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied && !(await authenticateDbToken(request))) return withNoStore(denied);

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
