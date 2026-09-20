-- 1) Candidate search no longer returns the auth user id.
DROP FUNCTION IF EXISTS public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer);

CREATE FUNCTION public.search_candidates_idempotent(
  _request_id uuid,
  _specialty_id uuid DEFAULT NULL::uuid,
  _country text DEFAULT NULL::text,
  _city text DEFAULT NULL::text,
  _min_experience integer DEFAULT NULL::integer,
  _limit integer DEFAULT 20
)
RETURNS TABLE(id uuid, headline text, specialty_id uuid, years_experience integer,
              country text, city text, bio text, is_open_to_shifts boolean, is_verified boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _facility uuid;
  _facility_verified boolean;
  _quota integer;
  _used integer;
  _cached jsonb;
  _internal jsonb;
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

  SELECT f.id, f.is_verified INTO _facility, _facility_verified
  FROM public.facilities f
  WHERE f.user_id = auth.uid()
  LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;

  IF NOT private.facility_profile_complete(_facility) THEN
    RAISE EXCEPTION 'FACILITY_PROFILE_INCOMPLETE';
  END IF;

  IF NOT COALESCE(_facility_verified, false) THEN
    RAISE EXCEPTION 'FACILITY_VERIFICATION_REQUIRED';
  END IF;

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
    SELECT x.id, NULL::text, x.specialty_id, x.years_experience,
           x.country, x.city, NULL::text, x.is_open_to_shifts, x.is_verified
    FROM jsonb_to_recordset(COALESCE(_cached, '[]'::jsonb)) AS x(
      id uuid, specialty_id uuid, years_experience integer, country text, city text,
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

  -- Internal set keeps user_id only to record search access; it is never cached or returned.
  SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  INTO _internal
  FROM (
    SELECT h.id, h.user_id, h.specialty_id, h.years_experience,
           h.country, h.city, h.is_open_to_shifts, h.is_verified
    FROM public.healthcare_professionals h
    JOIN auth.users au ON au.id = h.user_id
    WHERE h.is_searchable
      AND h.search_visibility_confirmed_at IS NOT NULL
      AND (_specialty_id IS NULL OR h.specialty_id = _specialty_id)
      AND (_country IS NULL OR h.country = _country)
      AND (_city IS NULL OR h.city = _city)
      AND (_min_experience IS NULL OR h.years_experience >= _min_experience)
    ORDER BY h.is_verified DESC, h.years_experience DESC, h.id
    LIMIT LEAST(GREATEST(COALESCE(_limit, 20), 1), 50)
  ) x;

  SELECT COALESCE(jsonb_agg(e - 'user_id'), '[]'::jsonb)
  INTO _cached
  FROM jsonb_array_elements(_internal) e;

  INSERT INTO public.candidate_search_access (facility_id, professional_user_id, last_searched_at)
  SELECT _facility, x.user_id, now()
  FROM jsonb_to_recordset(_internal) AS x(user_id uuid)
  ON CONFLICT (facility_id, professional_user_id)
  DO UPDATE SET last_searched_at = EXCLUDED.last_searched_at;

  UPDATE public.facility_subscriptions
  SET searches_used = searches_used + 1, updated_at = now()
  WHERE facility_id = _facility;

  UPDATE public.candidate_search_requests
  SET result = _cached, completed_at = now()
  WHERE facility_id = _facility AND request_id = _request_id;

  RETURN QUERY
  SELECT x.id, NULL::text, x.specialty_id, x.years_experience,
         x.country, x.city, NULL::text, x.is_open_to_shifts, x.is_verified
  FROM jsonb_to_recordset(_cached) AS x(
    id uuid, specialty_id uuid, years_experience integer, country text, city text,
    is_open_to_shifts boolean, is_verified boolean
  );
END;
$$;

-- 2) Scrub auth user ids from already cached search results.
UPDATE public.candidate_search_requests
SET result = (
  SELECT COALESCE(jsonb_agg(e - 'user_id'), '[]'::jsonb)
  FROM jsonb_array_elements(result) e
)
WHERE jsonb_typeof(result) = 'array'
  AND result::text LIKE '%"user_id"%';

-- 3) Search-driven outreach resolves the professional server-side, by profile id.
CREATE OR REPLACE FUNCTION private.resolve_searchable_candidate(_candidate_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid;
BEGIN
  IF _candidate_id IS NULL THEN RAISE EXCEPTION 'CANDIDATE_REQUIRED'; END IF;

  SELECT h.user_id INTO _uid
  FROM public.healthcare_professionals h
  JOIN auth.users au ON au.id = h.user_id
  WHERE h.id = _candidate_id
    AND h.is_searchable
    AND h.search_visibility_confirmed_at IS NOT NULL;

  IF _uid IS NULL THEN RAISE EXCEPTION 'CANDIDATE_NO_LONGER_SEARCHABLE'; END IF;
  RETURN _uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_candidate_conversation_from_search(
  _candidate_id uuid,
  _job_id uuid DEFAULT NULL::uuid,
  _shift_id uuid DEFAULT NULL::uuid,
  _subject text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid;
BEGIN
  PERFORM public.require_mfa();
  _uid := private.resolve_searchable_candidate(_candidate_id);
  RETURN public.start_candidate_conversation(_uid, _job_id, _shift_id, _subject);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_candidate_invitation_from_search(
  _candidate_id uuid,
  _job_id uuid DEFAULT NULL::uuid,
  _shift_id uuid DEFAULT NULL::uuid,
  _message text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid;
BEGIN
  PERFORM public.require_mfa();
  _uid := private.resolve_searchable_candidate(_candidate_id);
  RETURN public.send_candidate_invitation(_uid, _job_id, _shift_id, _message);
END;
$$;

REVOKE ALL ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.resolve_searchable_candidate(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_candidate_conversation_from_search(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_candidate_invitation_from_search(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_candidate_conversation_from_search(uuid, uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_candidate_invitation_from_search(uuid, uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.resolve_searchable_candidate(uuid) TO service_role;