CREATE OR REPLACE FUNCTION public.suggest_candidates(
  _job_id uuid DEFAULT NULL::uuid,
  _shift_id uuid DEFAULT NULL::uuid,
  _limit integer DEFAULT 10,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  specialty_id uuid,
  years_experience integer,
  country text,
  city text,
  is_open_to_shifts boolean,
  is_verified boolean,
  rating_avg numeric,
  rating_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _facility uuid;
  _facility_verified boolean;
  _spec uuid;
  _country text;
  _city text;
  _shift boolean := _shift_id IS NOT NULL;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF (_job_id IS NULL) = (_shift_id IS NULL) THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;

  SELECT f.id, f.is_verified INTO _facility, _facility_verified
  FROM public.facilities f
  WHERE f.user_id = auth.uid()
  LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;
  IF NOT COALESCE(_facility_verified, false) THEN RAISE EXCEPTION 'FACILITY_VERIFICATION_REQUIRED'; END IF;

  IF _job_id IS NOT NULL THEN
    SELECT j.specialty_id, j.country, j.city INTO _spec, _country, _city
    FROM public.jobs j WHERE j.id = _job_id AND j.facility_id = _facility;
  ELSE
    SELECT s.specialty_id, s.country, s.city INTO _spec, _country, _city
    FROM public.shifts s WHERE s.id = _shift_id AND s.facility_id = _facility;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  RETURN QUERY
  SELECT h.id, h.specialty_id, h.years_experience, h.country, h.city,
         h.is_open_to_shifts, h.is_verified, h.rating_avg, h.rating_count
  FROM public.healthcare_professionals h
  JOIN auth.users au ON au.id = h.user_id
  WHERE h.is_searchable
    AND h.search_visibility_confirmed_at IS NOT NULL
    AND (_spec IS NULL OR h.specialty_id = _spec)
    AND (NOT _shift OR h.is_open_to_shifts)
  ORDER BY
    (h.city IS NOT DISTINCT FROM _city) DESC,
    (h.country IS NOT DISTINCT FROM _country) DESC,
    h.is_verified DESC,
    h.rating_avg DESC,
    h.years_experience DESC,
    h.id
  LIMIT GREATEST(LEAST(COALESCE(_limit, 10), 50), 1)
  OFFSET GREATEST(COALESCE(_offset, 0), 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.suggest_candidates(uuid, uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.suggest_candidates(uuid, uuid, integer, integer) TO authenticated;