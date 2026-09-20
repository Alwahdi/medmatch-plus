-- Phase 84 (requested as Phase75): an invitation is explicit outbound contact,
-- so the invited professional may know who invited them — and keeps knowing it
-- after declining or cancellation, otherwise the history becomes unreadable.
CREATE OR REPLACE FUNCTION public.can_view_facility_identity(_facility_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND _user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.facilities f
      WHERE f.id = _facility_id
        AND f.user_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = f.user_id)
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.facility_id = _facility_id
          AND c.professional_user_id = _user_id
          AND c.identity_revealed
      )
      OR EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE j.facility_id = _facility_id
          AND a.user_id = _user_id
          AND a.status IN ('shortlisted','interview','offer','hired')
      )
      OR EXISTS (
        SELECT 1
        FROM public.shift_bookings b
        JOIN public.shifts s ON s.id = b.shift_id
        WHERE s.facility_id = _facility_id
          AND b.user_id = _user_id
          AND b.status = 'confirmed'
      )
      OR EXISTS (
        SELECT 1
        FROM public.invitations i
        WHERE i.facility_id = _facility_id
          AND i.professional_user_id = _user_id
      )
    );
$function$;

REVOKE ALL ON FUNCTION public.can_view_facility_identity(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_facility_identity(uuid, uuid) TO authenticated, service_role;