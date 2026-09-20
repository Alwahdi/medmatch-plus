-- Phase 56: self-scoped list of the caller's engaged employers that no longer have a live account.
CREATE OR REPLACE FUNCTION public.my_inactive_employers()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT DISTINCT fid
  FROM (
    SELECT j.facility_id AS fid
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.user_id = (SELECT auth.uid())
    UNION
    SELECT s.facility_id
    FROM public.shift_bookings b
    JOIN public.shifts s ON s.id = b.shift_id
    WHERE b.user_id = (SELECT auth.uid())
  ) engaged
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND NOT private.facility_has_live_owner(fid);
$function$;

REVOKE ALL ON FUNCTION public.my_inactive_employers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_inactive_employers() TO authenticated, service_role;