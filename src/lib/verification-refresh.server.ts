/**
 * Phase 103 — time-based verification refresh.
 *
 * Nothing changes a row when a required document expires by the mere passage
 * of time, so a daily maintenance pass recomputes the denormalized
 * `is_verified` flags from current evidence validity + suspension state.
 *
 * The RPC is service-role only (no anon/authenticated EXECUTE), idempotent,
 * and updates only rows whose flag actually differs.
 */
export type VerificationRefreshSummary = {
  professionals_updated: number;
  facilities_updated: number;
  ran_at: string;
};

export async function refreshVerificationExpiry(): Promise<VerificationRefreshSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("refresh_verification_expiry");
  if (error) throw new Error(error.message);
  return data as unknown as VerificationRefreshSummary;
}
