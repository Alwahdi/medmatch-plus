CREATE OR REPLACE FUNCTION public.can_read_avatar_path(_owner_folder text, _viewer uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _owner uuid;
BEGIN
  IF _viewer IS NULL OR _owner_folder IS NULL THEN
    RETURN false;
  END IF;

  BEGIN
    _owner := _owner_folder::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;

  IF _owner = _viewer THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _viewer AND ur.role = 'admin'::public.app_role
  ) THEN
    RETURN true;
  END IF;

  -- A professional may see a facility logo only after facility identity is revealed.
  IF EXISTS (
    SELECT 1
    FROM public.facilities f
    WHERE f.user_id = _owner
      AND (
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.facility_id = f.id
            AND c.professional_user_id = _viewer
            AND c.identity_revealed
        )
        OR EXISTS (
          SELECT 1
          FROM public.applications a
          JOIN public.jobs j ON j.id = a.job_id
          WHERE j.facility_id = f.id
            AND a.user_id = _viewer
            AND a.status IN ('shortlisted','interview','offer','hired')
        )
        OR EXISTS (
          SELECT 1
          FROM public.shift_bookings b
          JOIN public.shifts s ON s.id = b.shift_id
          WHERE s.facility_id = f.id
            AND b.user_id = _viewer
            AND b.status = 'confirmed'
        )
      )
  ) THEN
    RETURN true;
  END IF;

  -- A facility sees a professional avatar only after direct engagement.
  -- Candidate search results and pending invitations intentionally remain anonymous.
  IF EXISTS (
    SELECT 1
    FROM public.healthcare_professionals hp
    JOIN public.facilities vf ON vf.user_id = _viewer
    WHERE hp.user_id = _owner
      AND (
        EXISTS (
          SELECT 1
          FROM public.applications a
          JOIN public.jobs j ON j.id = a.job_id
          WHERE a.user_id = _owner
            AND j.facility_id = vf.id
        )
        OR EXISTS (
          SELECT 1
          FROM public.shift_bookings b
          JOIN public.shifts s ON s.id = b.shift_id
          WHERE b.user_id = _owner
            AND s.facility_id = vf.id
        )
        OR EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.professional_user_id = _owner
            AND c.facility_id = vf.id
        )
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

REVOKE ALL ON FUNCTION public.can_read_avatar_path(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_avatar_path(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_read_avatar_path(text, uuid) TO authenticated, service_role;