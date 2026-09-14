CREATE TABLE public.candidate_search_requests (
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  result jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (facility_id, request_id)
);
GRANT ALL ON public.candidate_search_requests TO service_role;
ALTER TABLE public.candidate_search_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.search_candidates_idempotent(
  _request_id uuid,
  _specialty_id uuid DEFAULT NULL,
  _country text DEFAULT NULL,
  _city text DEFAULT NULL,
  _min_experience integer DEFAULT NULL,
  _limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  headline text,
  specialty_id uuid,
  years_experience integer,
  country text,
  city text,
  bio text,
  is_open_to_shifts boolean,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _facility uuid;
  _quota integer;
  _used integer;
  _cached jsonb;
BEGIN
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
    WHERE r.facility_id = _facility AND r.request_id = _request_id AND r.completed_at IS NOT NULL
  ) THEN
    RETURN QUERY
    SELECT x.id, x.user_id, x.headline, x.specialty_id, x.years_experience,
           x.country, x.city, x.bio, x.is_open_to_shifts, x.is_verified
    FROM jsonb_to_recordset(_cached) AS x(
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
    AND s.status IN ('active', 'trialing')
    AND s.ends_at > now()
  FOR UPDATE OF s
  LIMIT 1;
  IF _quota IS NULL THEN RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION'; END IF;
  IF _quota >= 0 AND _used >= _quota THEN RAISE EXCEPTION 'SEARCH_QUOTA_EXCEEDED'; END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) INTO _cached
  FROM (
    SELECT h.id, h.user_id, h.headline, h.specialty_id, h.years_experience,
           h.country, h.city, h.bio, h.is_open_to_shifts, h.is_verified
    FROM public.healthcare_professionals h
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
  SELECT x.id, x.user_id, x.headline, x.specialty_id, x.years_experience,
         x.country, x.city, x.bio, x.is_open_to_shifts, x.is_verified
  FROM jsonb_to_recordset(_cached) AS x(
    id uuid, user_id uuid, headline text, specialty_id uuid,
    years_experience integer, country text, city text, bio text,
    is_open_to_shifts boolean, is_verified boolean
  );
END;
$$;
REVOKE ALL ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_job_application(_job_id uuid, _cover_letter text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _application_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  IF length(COALESCE(_cover_letter, '')) > 2000 THEN RAISE EXCEPTION 'COVER_TOO_LONG'; END IF;
  PERFORM 1 FROM public.jobs j
  WHERE j.id = _job_id AND j.is_active AND (j.expires_at IS NULL OR j.expires_at > now())
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;
  INSERT INTO public.applications (job_id, user_id, cover_letter)
  VALUES (_job_id, auth.uid(), NULLIF(btrim(_cover_letter), ''))
  ON CONFLICT (job_id, user_id) DO UPDATE SET job_id = EXCLUDED.job_id
  RETURNING id INTO _application_id;
  RETURN _application_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_job_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_job_application(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.book_open_shift(_shift_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _booking_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  PERFORM 1 FROM public.shifts s
  WHERE s.id = _shift_id AND s.status = 'open' AND s.starts_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;
  INSERT INTO public.shift_bookings (shift_id, user_id, status)
  VALUES (_shift_id, auth.uid(), 'confirmed')
  ON CONFLICT (shift_id) DO NOTHING
  RETURNING id INTO _booking_id;
  IF _booking_id IS NULL THEN RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;
  RETURN _booking_id;
END;
$$;
REVOKE ALL ON FUNCTION public.book_open_shift(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_open_shift(uuid) TO authenticated, service_role;

CREATE UNIQUE INDEX invitations_unique_job_candidate
ON public.invitations (facility_id, professional_user_id, job_id)
WHERE job_id IS NOT NULL;
CREATE UNIQUE INDEX invitations_unique_shift_candidate
ON public.invitations (facility_id, professional_user_id, shift_id)
WHERE shift_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.send_candidate_invitation(
  _professional_user_id uuid,
  _job_id uuid DEFAULT NULL,
  _shift_id uuid DEFAULT NULL,
  _message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _facility uuid; _invitation_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF num_nonnulls(_job_id, _shift_id) <> 1 THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
  IF length(COALESCE(_message, '')) > 500 THEN RAISE EXCEPTION 'MESSAGE_TOO_LONG'; END IF;
  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_search_access a
    WHERE a.facility_id = _facility AND a.professional_user_id = _professional_user_id
  ) AND NOT public.has_engagement(_facility, _professional_user_id) THEN
    RAISE EXCEPTION 'CANDIDATE_INVITE_NOT_ALLOWED';
  END IF;
  IF _job_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = _job_id AND j.facility_id = _facility
      AND j.is_active AND (j.expires_at IS NULL OR j.expires_at > now())
  ) THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;
  IF _shift_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shifts s WHERE s.id = _shift_id AND s.facility_id = _facility
      AND s.status = 'open' AND s.starts_at > now()
  ) THEN RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;
  INSERT INTO public.invitations (facility_id, professional_user_id, job_id, shift_id, message)
  VALUES (_facility, _professional_user_id, _job_id, _shift_id, NULLIF(btrim(_message), ''))
  ON CONFLICT DO NOTHING
  RETURNING id INTO _invitation_id;
  IF _invitation_id IS NULL THEN RAISE EXCEPTION 'INVITATION_EXISTS'; END IF;
  RETURN _invitation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.send_candidate_invitation(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_candidate_invitation(uuid, uuid, uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.validate_application_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = NEW.job_id AND j.is_active AND (j.expires_at IS NULL OR j.expires_at > now())) THEN
    RAISE EXCEPTION 'JOB_CLOSED';
  END IF;
  IF NEW.user_id <> auth.uid() OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_application_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_application_before_insert ON public.applications;
CREATE TRIGGER validate_application_before_insert BEFORE INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.validate_application_insert();

CREATE OR REPLACE FUNCTION public.validate_booking_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shifts s WHERE s.id = NEW.shift_id AND s.status = 'open' AND s.starts_at > now()) THEN
    RAISE EXCEPTION 'SHIFT_UNAVAILABLE';
  END IF;
  IF NEW.user_id <> auth.uid() OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_booking_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_booking_before_insert ON public.shift_bookings;
CREATE TRIGGER validate_booking_before_insert BEFORE INSERT ON public.shift_bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_insert();

REVOKE INSERT ON public.applications FROM authenticated;
REVOKE INSERT ON public.shift_bookings FROM authenticated;
REVOKE INSERT ON public.invitations FROM authenticated;