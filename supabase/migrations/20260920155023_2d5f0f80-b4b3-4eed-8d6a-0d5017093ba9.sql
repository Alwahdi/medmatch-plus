-- Phase 79 (requested as Phase72; that label was already used):
-- Verified-facility gate for proactive talent discovery + live opt-out enforcement.

-- Live, consenting, discoverable professional (Phase 71 consent invariant + live account).
CREATE OR REPLACE FUNCTION private.professional_is_discoverable(_professional_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.healthcare_professionals h
    JOIN auth.users au ON au.id = h.user_id
    WHERE h.user_id = _professional_user_id
      AND h.is_searchable
      AND h.search_visibility_confirmed_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION private.facility_is_verified(_facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT f.is_verified FROM public.facilities f WHERE f.id = _facility_id), false);
$$;

-- Relationship the professional (or the platform) already initiated elsewhere.
CREATE OR REPLACE FUNCTION private.facility_pro_relationship(_facility_id uuid, _professional_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.facility_id = _facility_id AND a.user_id = _professional_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.shift_bookings b
    JOIN public.shifts s ON s.id = b.shift_id
    WHERE s.facility_id = _facility_id AND b.user_id = _professional_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.facility_id = _facility_id AND c.professional_user_id = _professional_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.facility_id = _facility_id AND i.professional_user_id = _professional_user_id
  );
$$;

-- Search-only authorization: verified facility + prior search access + live consenting candidate.
-- Raises the specific reason so the UI can explain it truthfully.
CREATE OR REPLACE FUNCTION private.assert_proactive_contact_allowed(_facility_id uuid, _professional_user_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF private.facility_pro_relationship(_facility_id, _professional_user_id) THEN
    RETURN; -- existing relationship: unaffected by searchability or verification
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_search_access a
    WHERE a.facility_id = _facility_id AND a.professional_user_id = _professional_user_id
  ) THEN
    RAISE EXCEPTION 'CANDIDATE_CONTACT_NOT_ALLOWED';
  END IF;

  IF NOT private.facility_is_verified(_facility_id) THEN
    RAISE EXCEPTION 'FACILITY_VERIFICATION_REQUIRED';
  END IF;

  IF NOT private.professional_is_discoverable(_professional_user_id) THEN
    RAISE EXCEPTION 'CANDIDATE_NO_LONGER_SEARCHABLE';
  END IF;
END;
$$;

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

  -- Proactive talent discovery requires a verified facility. Raised before any
  -- request row or quota consumption so an unverified facility is never charged.
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

  -- Existing relationship authorizes regardless of verification/searchability;
  -- search-only contact is evaluated live against the candidate's current consent.
  PERFORM private.assert_proactive_contact_allowed(_facility, _professional_user_id);

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

  PERFORM private.assert_proactive_contact_allowed(_facility, _professional_user_id);

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
$function$;

-- Phase 60 privilege safety gate: explicit revoke then explicit grant.
REVOKE ALL ON FUNCTION private.professional_is_discoverable(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.facility_is_verified(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.facility_pro_relationship(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.assert_proactive_contact_allowed(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.professional_is_discoverable(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.facility_is_verified(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.facility_pro_relationship(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.assert_proactive_contact_allowed(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_candidate_conversation(uuid, uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_candidate_invitation(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_candidate_conversation(uuid, uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_candidate_invitation(uuid, uuid, uuid, text) TO authenticated, service_role;