-- Phase 50: real MFA enforcement in the database.
-- mfa_access_ok(): self-scoped only; true when the caller has no verified MFA
-- factor, otherwise only when the current session reached aal2.
CREATE OR REPLACE FUNCTION public.mfa_access_ok()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE _enrolled boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT EXISTS (
    SELECT 1 FROM auth.mfa_factors f
    WHERE f.user_id = auth.uid() AND f.status = 'verified'
  ) INTO _enrolled;
  IF NOT _enrolled THEN RETURN true; END IF;
  RETURN COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
END;
$function$;

CREATE OR REPLACE FUNCTION public.require_mfa()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.mfa_access_ok() THEN
    RAISE EXCEPTION 'MFA_REQUIRED';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.mfa_access_ok() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.require_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mfa_access_ok() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.require_mfa() TO authenticated, service_role;

-- Restrictive MFA gate on private tables (public sanitized views, specialties,
-- subscription_plans and user_roles stay reachable so the challenge flow works).
DROP POLICY IF EXISTS "mfa level required" ON public.alert_deliveries;
CREATE POLICY "mfa level required" ON public.alert_deliveries
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.applications;
CREATE POLICY "mfa level required" ON public.applications
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.contact_messages;
CREATE POLICY "mfa level required" ON public.contact_messages
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.conversations;
CREATE POLICY "mfa level required" ON public.conversations
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.credentials;
CREATE POLICY "mfa level required" ON public.credentials
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.facilities;
CREATE POLICY "mfa level required" ON public.facilities
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.facility_documents;
CREATE POLICY "mfa level required" ON public.facility_documents
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.facility_subscriptions;
CREATE POLICY "mfa level required" ON public.facility_subscriptions
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.healthcare_professionals;
CREATE POLICY "mfa level required" ON public.healthcare_professionals
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.interviews;
CREATE POLICY "mfa level required" ON public.interviews
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.invitations;
CREATE POLICY "mfa level required" ON public.invitations
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.job_alerts;
CREATE POLICY "mfa level required" ON public.job_alerts
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.jobs;
CREATE POLICY "mfa level required" ON public.jobs
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.message_reactions;
CREATE POLICY "mfa level required" ON public.message_reactions
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.messages;
CREATE POLICY "mfa level required" ON public.messages
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.notifications;
CREATE POLICY "mfa level required" ON public.notifications
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.profile_change_log;
CREATE POLICY "mfa level required" ON public.profile_change_log
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.profile_change_requests;
CREATE POLICY "mfa level required" ON public.profile_change_requests
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.profiles;
CREATE POLICY "mfa level required" ON public.profiles
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.reviews;
CREATE POLICY "mfa level required" ON public.reviews
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.saved_jobs;
CREATE POLICY "mfa level required" ON public.saved_jobs
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.shift_bookings;
CREATE POLICY "mfa level required" ON public.shift_bookings
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.shifts;
CREATE POLICY "mfa level required" ON public.shifts
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());
DROP POLICY IF EXISTS "mfa level required" ON public.trusted_devices;
CREATE POLICY "mfa level required" ON public.trusted_devices
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.mfa_access_ok())
WITH CHECK (public.mfa_access_ok());

CREATE OR REPLACE FUNCTION public.my_sessions()
 RETURNS TABLE(id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, user_agent text, ip text, not_after timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT s.id, s.created_at, s.updated_at, s.user_agent, host(s.ip)::text, s.not_after
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
    AND public.mfa_access_ok()
  ORDER BY s.updated_at DESC NULLS LAST
  LIMIT 50
$function$;