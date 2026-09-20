-- Phase 77 (cont.): candidate search reuses the shared lifecycle predicate.
CREATE OR REPLACE FUNCTION public.search_candidates_idempotent(
  _request_id uuid,
  _specialty_id uuid DEFAULT NULL::uuid,
  _country text DEFAULT NULL::text,
  _city text DEFAULT NULL::text,
  _min_experience integer DEFAULT NULL::integer,
  _limit integer DEFAULT 20
)
RETURNS TABLE(id uuid, user_id uuid, headline text, specialty_id uuid, years_experience integer, country text, city text, bio text, is_open_to_shifts boolean, is_verified boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _facility uuid;
  _quota integer;
  _used integer;
  _cached jsonb;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL OR _request_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;
  IF _min_experience IS NOT NULL AND (_min_experience < 0 OR _min_experience > 60) THEN
    RAISE EXCEPTION 'INVALID_EXPERIENCE';
  END IF;
  IF length(COALESCE(_country, '')) > 100 OR length(COALESCE(_city, '')) > 100 THEN
    RAISE EXCEPTION 'INVALID_FILTER';
  END IF;

  SELECT f.id INTO _facility
  FROM public.facilities f
  WHERE f.user_id = auth.uid()
  LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;

  INSERT INTO public.candidate_search_requests (facility_id, request_id)
  VALUES (_facility, _request_id)
  ON CONFLICT DO NOTHING;

  SELECT r.result INTO _cached
  FROM public.candidate_search_requests r
  WHERE r.facility_id = _facility AND r.request_id = _request_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.candidate_search_requests r
    WHERE r.facility_id = _facility
      AND r.request_id = _request_id
      AND r.completed_at IS NOT NULL
  ) THEN
    RETURN QUERY
    SELECT x.id, x.user_id, NULL::text, x.specialty_id, x.years_experience,
           x.country, x.city, NULL::text, x.is_open_to_shifts, x.is_verified
    FROM jsonb_to_recordset(COALESCE(_cached, '[]'::jsonb)) AS x(
      id uuid, user_id uuid, headline text, specialty_id uuid,
      years_experience integer, country text, city text, bio text,
      is_open_to_shifts boolean, is_verified boolean
    );
    RETURN;
  END IF;

  SELECT p.candidate_searches, s.searches_used
  INTO _quota, _used
  FROM public.facility_subscriptions s
  JOIN public.subscription_plans p ON p.code = s.plan_code
  WHERE s.facility_id = _facility
    AND private.subscription_is_live(s.status, s.ends_at)
  FOR UPDATE OF s
  LIMIT 1;

  IF _quota IS NULL THEN RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION'; END IF;
  IF _quota >= 0 AND _used >= _quota THEN RAISE EXCEPTION 'SEARCH_QUOTA_EXCEEDED'; END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  INTO _cached
  FROM (
    SELECT h.id, h.user_id, NULL::text AS headline, h.specialty_id, h.years_experience,
           h.country, h.city, NULL::text AS bio, h.is_open_to_shifts, h.is_verified
    FROM public.healthcare_professionals h
    JOIN auth.users au ON au.id = h.user_id
    WHERE h.is_searchable
      AND (_specialty_id IS NULL OR h.specialty_id = _specialty_id)
      AND (_country IS NULL OR h.country = _country)
      AND (_city IS NULL OR h.city = _city)
      AND (_min_experience IS NULL OR h.years_experience >= _min_experience)
    ORDER BY h.is_verified DESC, h.years_experience DESC, h.id
    LIMIT LEAST(GREATEST(COALESCE(_limit, 20), 1), 50)
  ) x;

  INSERT INTO public.candidate_search_access (facility_id, professional_user_id, last_searched_at)
  SELECT _facility, x.user_id, now()
  FROM jsonb_to_recordset(_cached) AS x(user_id uuid)
  ON CONFLICT (facility_id, professional_user_id)
  DO UPDATE SET last_searched_at = EXCLUDED.last_searched_at;

  UPDATE public.facility_subscriptions
  SET searches_used = searches_used + 1, updated_at = now()
  WHERE facility_id = _facility;

  UPDATE public.candidate_search_requests
  SET result = _cached, completed_at = now()
  WHERE facility_id = _facility AND request_id = _request_id;

  RETURN QUERY
  SELECT x.id, x.user_id, NULL::text, x.specialty_id, x.years_experience,
         x.country, x.city, NULL::text, x.is_open_to_shifts, x.is_verified
  FROM jsonb_to_recordset(_cached) AS x(
    id uuid, user_id uuid, headline text, specialty_id uuid,
    years_experience integer, country text, city text, bio text,
    is_open_to_shifts boolean, is_verified boolean
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) TO authenticated, service_role;

-- Legacy atomic variant (service_role only) kept aligned with the same predicate.
DROP FUNCTION IF EXISTS public.search_candidates_atomic(uuid, text, text, integer, integer);