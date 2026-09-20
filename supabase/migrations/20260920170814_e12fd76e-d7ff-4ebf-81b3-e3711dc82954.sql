-- Phase80: backend-enforced onboarding completeness gates.

CREATE OR REPLACE FUNCTION private.professional_profile_complete(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.healthcare_professionals h
    JOIN auth.users u ON u.id = h.user_id
    JOIN public.specialties s ON s.id = h.specialty_id
    WHERE h.user_id = _user_id
      AND length(btrim(COALESCE(h.full_name, ''))) >= 2
      AND length(btrim(COALESCE(h.country, ''))) > 0
      AND length(btrim(COALESCE(h.city, ''))) > 0
      AND h.years_experience BETWEEN 0 AND 60
  );
$$;

CREATE OR REPLACE FUNCTION private.facility_profile_complete(_facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.facilities f
    JOIN auth.users u ON u.id = f.user_id
    WHERE f.id = _facility_id
      AND length(btrim(COALESCE(f.name_ar, ''))) >= 2
      AND length(btrim(COALESCE(f.facility_type, ''))) > 0
      AND length(btrim(COALESCE(f.country, ''))) > 0
      AND length(btrim(COALESCE(f.city, ''))) > 0
  );
$$;

-- Self-scoped read for the UI: never probes another account.
CREATE OR REPLACE FUNCTION public.my_profile_completeness()
RETURNS TABLE(professional_complete boolean, facility_complete boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT
    COALESCE(private.professional_profile_complete(auth.uid()), false),
    COALESCE((
      SELECT private.facility_profile_complete(f.id)
      FROM public.facilities f
      WHERE f.user_id = auth.uid()
      LIMIT 1
    ), false)
  WHERE auth.uid() IS NOT NULL;
$$;

-- ---------- role claims ----------
CREATE OR REPLACE FUNCTION public.claim_professional_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  IF EXISTS (SELECT 1 FROM public.facilities f WHERE f.user_id = auth.uid())
     OR EXISTS (
       SELECT 1 FROM public.user_roles r
       WHERE r.user_id = auth.uid() AND r.role = 'facility'::public.app_role
     ) THEN
    RAISE EXCEPTION 'ACCOUNT_TYPE_CONFLICT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.healthcare_professionals hp
    WHERE hp.user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  IF NOT private.professional_profile_complete(auth.uid()) THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'professional')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_facility_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _facility uuid;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  IF EXISTS (
       SELECT 1 FROM public.healthcare_professionals hp
       WHERE hp.user_id = auth.uid()
     )
     OR EXISTS (
       SELECT 1 FROM public.user_roles r
       WHERE r.user_id = auth.uid() AND r.role = 'professional'::public.app_role
     ) THEN
    RAISE EXCEPTION 'ACCOUNT_TYPE_CONFLICT';
  END IF;

  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RETURN false; END IF;

  IF NOT private.facility_profile_complete(_facility) THEN
    RAISE EXCEPTION 'FACILITY_PROFILE_INCOMPLETE';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'facility')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$function$;

-- ---------- professional operational gates ----------
CREATE OR REPLACE FUNCTION public.submit_job_application(_job_id uuid, _cover_letter text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _application_id uuid; _cur public.application_status; _cover text;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  IF NOT private.professional_profile_complete(auth.uid()) THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE';
  END IF;
  IF length(COALESCE(_cover_letter, '')) > 2000 THEN RAISE EXCEPTION 'COVER_TOO_LONG'; END IF;
  _cover := NULLIF(btrim(COALESCE(_cover_letter,'')), '');

  PERFORM 1 FROM public.jobs j
  WHERE j.id = _job_id AND j.is_active AND (j.expires_at IS NULL OR j.expires_at > now())
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  SELECT a.id, a.status INTO _application_id, _cur
    FROM public.applications a
   WHERE a.job_id = _job_id AND a.user_id = auth.uid()
   FOR UPDATE;

  IF _application_id IS NOT NULL THEN
    IF _cur = 'withdrawn' THEN
      UPDATE public.applications
         SET status = 'submitted', withdrawn_at = NULL, withdrawal_reason = NULL,
             cover_letter = _cover, updated_at = now()
       WHERE id = _application_id;
    END IF;
    RETURN _application_id;
  END IF;

  INSERT INTO public.applications (job_id, user_id, cover_letter)
  VALUES (_job_id, auth.uid(), _cover)
  ON CONFLICT (job_id, user_id) DO UPDATE SET job_id = EXCLUDED.job_id
  RETURNING id INTO _application_id;
  RETURN _application_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.book_open_shift(_shift_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _booking_id uuid;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  IF NOT private.professional_profile_complete(auth.uid()) THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE';
  END IF;
  PERFORM 1 FROM public.shifts s
  WHERE s.id = _shift_id AND s.status = 'open' AND s.starts_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;

  BEGIN
    INSERT INTO public.shift_bookings (shift_id, user_id, status)
    VALUES (_shift_id, auth.uid(), 'confirmed')
    RETURNING id INTO _booking_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'SHIFT_UNAVAILABLE';
  END;

  IF _booking_id IS NULL THEN RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;
  RETURN _booking_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_search_visibility(_visible boolean)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _confirmed timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  PERFORM public.require_mfa();
  IF _visible IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

  -- Opting IN requires a complete profile; opting out must always stay possible.
  IF _visible AND NOT private.professional_profile_complete(auth.uid()) THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE';
  END IF;

  UPDATE public.healthcare_professionals h
  SET is_searchable = _visible,
      search_visibility_confirmed_at = CASE
        WHEN _visible THEN now()
        ELSE h.search_visibility_confirmed_at
      END,
      updated_at = now()
  WHERE h.user_id = auth.uid()
  RETURNING h.search_visibility_confirmed_at INTO _confirmed;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_PROFESSIONAL_PROFILE';
  END IF;

  RETURN CASE WHEN _visible THEN _confirmed ELSE NULL END;
END;
$function$;

-- ---------- facility operational gates ----------
CREATE OR REPLACE FUNCTION public.send_candidate_invitation(_professional_user_id uuid, _job_id uuid DEFAULT NULL::uuid, _shift_id uuid DEFAULT NULL::uuid, _message text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _facility uuid; _invitation_id uuid;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF num_nonnulls(_job_id, _shift_id) <> 1 THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
  IF length(COALESCE(_message, '')) > 500 THEN RAISE EXCEPTION 'MESSAGE_TOO_LONG'; END IF;
  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;
  IF NOT private.facility_profile_complete(_facility) THEN
    RAISE EXCEPTION 'FACILITY_PROFILE_INCOMPLETE';
  END IF;

  PERFORM private.assert_proactive_contact_allowed(_facility, _professional_user_id, _job_id, _shift_id);

  IF NOT private.invitation_target_available(_facility, _job_id, _shift_id, true) THEN
    IF _job_id IS NOT NULL THEN RAISE EXCEPTION 'JOB_CLOSED'; ELSE RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;
  END IF;

  INSERT INTO public.invitations (facility_id, professional_user_id, job_id, shift_id, message)
  VALUES (_facility, _professional_user_id, _job_id, _shift_id, NULLIF(btrim(_message), ''))
  ON CONFLICT DO NOTHING
  RETURNING id INTO _invitation_id;
  IF _invitation_id IS NULL THEN RAISE EXCEPTION 'INVITATION_EXISTS'; END IF;
  RETURN _invitation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_candidate_conversation(_professional_user_id uuid, _job_id uuid DEFAULT NULL::uuid, _shift_id uuid DEFAULT NULL::uuid, _subject text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _facility uuid; _conversation uuid; _subj text;
BEGIN
  PERFORM public.require_mfa();
  IF _professional_user_id IS NULL THEN RAISE EXCEPTION 'CANDIDATE_REQUIRED'; END IF;
  IF num_nonnulls(_job_id, _shift_id) > 1 THEN RAISE EXCEPTION 'CONVERSATION_TARGET_INVALID'; END IF;

  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;

  IF _job_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = _job_id AND j.facility_id = _facility
  ) THEN RAISE EXCEPTION 'CONVERSATION_TARGET_INVALID'; END IF;

  IF _shift_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shifts s WHERE s.id = _shift_id AND s.facility_id = _facility
  ) THEN RAISE EXCEPTION 'CONVERSATION_TARGET_INVALID'; END IF;

  _subj := NULLIF(btrim(COALESCE(_subject,'')), '');
  IF _subj IS NOT NULL AND length(_subj) > 160 THEN RAISE EXCEPTION 'SUBJECT_TOO_LONG'; END IF;

  -- Existing conversations are reused below, so this gate only blocks NEW outreach.
  IF NOT private.facility_profile_complete(_facility) THEN
    SELECT c.id INTO _conversation FROM public.conversations c
    WHERE c.facility_id=_facility AND c.professional_user_id=_professional_user_id
      AND c.job_id IS NOT DISTINCT FROM _job_id AND c.shift_id IS NOT DISTINCT FROM _shift_id
    ORDER BY c.created_at DESC LIMIT 1;
    IF _conversation IS NOT NULL THEN RETURN _conversation; END IF;
    RAISE EXCEPTION 'FACILITY_PROFILE_INCOMPLETE';
  END IF;

  PERFORM private.assert_proactive_contact_allowed(_facility, _professional_user_id, _job_id, _shift_id);

  SELECT c.id INTO _conversation FROM public.conversations c
  WHERE c.facility_id=_facility AND c.professional_user_id=_professional_user_id
    AND c.job_id IS NOT DISTINCT FROM _job_id AND c.shift_id IS NOT DISTINCT FROM _shift_id
  ORDER BY c.created_at DESC LIMIT 1;
  IF _conversation IS NOT NULL THEN RETURN _conversation; END IF;

  INSERT INTO public.conversations (facility_id, professional_user_id, job_id, shift_id, subject, identity_revealed)
  VALUES (_facility, _professional_user_id, _job_id, _shift_id, _subj, true)
  RETURNING id INTO _conversation;
  RETURN _conversation;
END; $function$;

CREATE OR REPLACE FUNCTION public.search_candidates_idempotent(_request_id uuid, _specialty_id uuid DEFAULT NULL::uuid, _country text DEFAULT NULL::text, _city text DEFAULT NULL::text, _min_experience integer DEFAULT NULL::integer, _limit integer DEFAULT 20)
RETURNS TABLE(id uuid, user_id uuid, headline text, specialty_id uuid, years_experience integer, country text, city text, bio text, is_open_to_shifts boolean, is_verified boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _facility uuid;
  _facility_verified boolean;
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

  SELECT f.id, f.is_verified INTO _facility, _facility_verified
  FROM public.facilities f
  WHERE f.user_id = auth.uid()
  LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;

  -- Checked before any request row or quota consumption.
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
      AND h.search_visibility_confirmed_at IS NOT NULL
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

-- ---------- publishing gate (jobs / shifts) ----------
CREATE OR REPLACE FUNCTION public.guard_facility_profile_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT private.facility_profile_complete(NEW.facility_id) THEN
    RAISE EXCEPTION 'FACILITY_PROFILE_INCOMPLETE';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_jobs_facility_profile ON public.jobs;
CREATE TRIGGER guard_jobs_facility_profile
BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.guard_facility_profile_complete();

DROP TRIGGER IF EXISTS guard_shifts_facility_profile ON public.shifts;
CREATE TRIGGER guard_shifts_facility_profile
BEFORE INSERT ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.guard_facility_profile_complete();

-- ---------- least-privilege grants (Phase60) ----------
REVOKE ALL ON FUNCTION private.professional_profile_complete(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.facility_profile_complete(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_profile_completeness() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.guard_facility_profile_complete() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_profile_completeness() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_profile_completeness() TO service_role;
GRANT EXECUTE ON FUNCTION private.professional_profile_complete(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.facility_profile_complete(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.guard_facility_profile_complete() TO service_role;