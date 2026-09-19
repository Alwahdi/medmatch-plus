-- Phase: self-scope public authorization helpers (idempotent mirror of live hotfix)

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
$function$;

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
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
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
      FROM public.conversations c
      LEFT JOIN public.facilities f ON f.id = c.facility_id
      WHERE c.id = _conversation_id
        AND (c.professional_user_id = _user_id OR f.user_id = _user_id)
    );
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_facility_identity(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_facility_identity(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;