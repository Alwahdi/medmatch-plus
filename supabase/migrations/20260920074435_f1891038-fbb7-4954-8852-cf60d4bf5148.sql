-- Phase 66: block direct destructive identity/history deletes (idempotent)

-- 1) Identity / history rows: never client-deletable
DROP POLICY IF EXISTS "facility owner delete" ON public.facilities;

REVOKE DELETE ON public.facilities FROM anon, authenticated;
REVOKE DELETE ON public.profiles FROM anon, authenticated;
REVOKE DELETE ON public.healthcare_professionals FROM anon, authenticated;
REVOKE DELETE ON public.conversations FROM anon, authenticated;
REVOKE DELETE ON public.messages FROM anon, authenticated;
REVOKE DELETE ON public.trusted_devices FROM anon, authenticated;

-- 2) Listings: close/cancel workflows only, no direct delete (history preserving)
DROP POLICY IF EXISTS "jobs facility delete" ON public.jobs;
DROP POLICY IF EXISTS "shifts facility delete" ON public.shifts;
REVOKE DELETE ON public.jobs FROM anon, authenticated;
REVOKE DELETE ON public.shifts FROM anon, authenticated;

-- 3) Dead grants with no client delete flow
REVOKE DELETE ON public.invitations FROM anon, authenticated;
REVOKE DELETE ON public.profile_change_requests FROM anon, authenticated;

-- 4) Obsolete delete policy: booking cancellation is RPC-only (cancel_my_shift_booking)
DROP POLICY IF EXISTS "booking cancel before start" ON public.shift_bookings;
REVOKE DELETE ON public.shift_bookings FROM anon, authenticated;

-- 5) Intentional owner-deletion flows remain (no change, asserted explicitly)
GRANT DELETE ON public.notifications TO authenticated;
GRANT DELETE ON public.message_reactions TO authenticated;
GRANT DELETE ON public.saved_jobs TO authenticated;
GRANT DELETE ON public.job_alerts TO authenticated;
GRANT DELETE ON public.credentials TO authenticated;
GRANT DELETE ON public.facility_documents TO authenticated;

-- service_role keeps full access for trusted backend operations
GRANT ALL ON public.facilities, public.profiles, public.healthcare_professionals,
  public.conversations, public.messages, public.trusted_devices,
  public.jobs, public.shifts, public.invitations,
  public.profile_change_requests, public.shift_bookings TO service_role;