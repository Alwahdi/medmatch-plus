-- Phase 80 (requested as Phase76; that label was already used)
-- Candidate discoverability controls FUTURE search-based outreach.

CREATE OR REPLACE FUNCTION private.candidate_contact_access_retention()
RETURNS interval LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT interval '30 days' $$;

COMMENT ON FUNCTION private.candidate_contact_access_retention() IS
'Contact-access retention for search-derived outreach rights. Audit rows in candidate_search_access are never deleted; they simply stop authorizing NEW outreach after this period.';

-- Central outreach authorization helper. Returns the basis that authorizes
-- facility -> professional outreach for the given target, or NULL.
CREATE OR REPLACE FUNCTION private.can_facility_initiate_candidate_contact(
  _facility_id uuid,
  _professional_user_id uuid,
  _job_id uuid DEFAULT NULL,
  _shift_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- Active/relevant application: withdrawn/rejected alone never authorizes NEW outreach.
    WHEN EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE j.facility_id = _facility_id
        AND a.user_id = _professional_user_id
        AND a.status IN ('submitted','reviewing','shortlisted','interview','offer','hired')
    ) THEN 'application'
    -- Confirmed booking (including a completed shift whose booking stays confirmed).
    WHEN EXISTS (
      SELECT 1 FROM public.shift_bookings b
      JOIN public.shifts s ON s.id = b.shift_id
      WHERE s.facility_id = _facility_id
        AND b.user_id = _professional_user_id
        AND b.status = 'confirmed'
    ) THEN 'booking'
    -- An existing conversation authorizes continuing THAT conversation only.
    WHEN EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.facility_id = _facility_id
        AND c.professional_user_id = _professional_user_id
        AND c.job_id IS NOT DISTINCT FROM _job_id
        AND c.shift_id IS NOT DISTINCT FROM _shift_id
    ) THEN 'conversation'
    -- A live invitation relationship (pending/accepted); declined/cancelled does not count.
    WHEN EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE i.facility_id = _facility_id
        AND i.professional_user_id = _professional_user_id
        AND i.status IN ('pending','accepted')
    ) THEN 'invitation'
    -- Search-origin outreach: verified facility + fresh access + current consent.
    WHEN private.facility_is_verified(_facility_id)
      AND private.professional_is_discoverable(_professional_user_id)
      AND EXISTS (
        SELECT 1 FROM public.candidate_search_access a
        WHERE a.facility_id = _facility_id
          AND a.professional_user_id = _professional_user_id
          AND a.last_searched_at > now() - private.candidate_contact_access_retention()
      ) THEN 'search'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION private.assert_proactive_contact_allowed(
  _facility_id uuid,
  _professional_user_id uuid,
  _job_id uuid DEFAULT NULL,
  _shift_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _basis text; _last timestamptz;
BEGIN
  _basis := private.can_facility_initiate_candidate_contact(
    _facility_id, _professional_user_id, _job_id, _shift_id);
  IF _basis IS NOT NULL THEN RETURN; END IF;

  SELECT a.last_searched_at INTO _last
  FROM public.candidate_search_access a
  WHERE a.facility_id = _facility_id AND a.professional_user_id = _professional_user_id;

  IF _last IS NULL THEN
    RAISE EXCEPTION 'CANDIDATE_CONTACT_NOT_ALLOWED';
  END IF;

  IF NOT private.facility_is_verified(_facility_id) THEN
    RAISE EXCEPTION 'FACILITY_VERIFICATION_REQUIRED';
  END IF;

  IF NOT private.professional_is_discoverable(_professional_user_id) THEN
    RAISE EXCEPTION 'CANDIDATE_NO_LONGER_SEARCHABLE';
  END IF;

  IF _last <= now() - private.candidate_contact_access_retention() THEN
    RAISE EXCEPTION 'CANDIDATE_SEARCH_ACCESS_EXPIRED';
  END IF;

  RAISE EXCEPTION 'CANDIDATE_CONTACT_NOT_ALLOWED';
END;
$$;

-- Pass the requested target through so an existing conversation authorizes
-- only itself, not a different job/shift thread.
CREATE OR REPLACE FUNCTION public.start_candidate_conversation(_professional_user_id uuid, _job_id uuid DEFAULT NULL::uuid, _shift_id uuid DEFAULT NULL::uuid, _subject text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.send_candidate_invitation(_professional_user_id uuid, _job_id uuid DEFAULT NULL::uuid, _shift_id uuid DEFAULT NULL::uuid, _message text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _facility uuid; _invitation_id uuid;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF num_nonnulls(_job_id, _shift_id) <> 1 THEN RAISE EXCEPTION 'INVALID_TARGET'; END IF;
  IF length(COALESCE(_message, '')) > 500 THEN RAISE EXCEPTION 'MESSAGE_TOO_LONG'; END IF;
  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;

  -- Invitations are new outreach for a specific target, so an unrelated existing
  -- conversation must not authorize them.
  PERFORM private.assert_proactive_contact_allowed(_facility, _professional_user_id, _job_id, _shift_id);

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

-- Phase 60 explicit least-privilege grants
REVOKE ALL ON FUNCTION private.candidate_contact_access_retention() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_facility_initiate_candidate_contact(uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.assert_proactive_contact_allowed(uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.assert_proactive_contact_allowed(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.candidate_contact_access_retention() TO service_role;
GRANT EXECUTE ON FUNCTION private.can_facility_initiate_candidate_contact(uuid, uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.assert_proactive_contact_allowed(uuid, uuid, uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.start_candidate_conversation(uuid, uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_candidate_invitation(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_candidate_conversation(uuid, uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_candidate_invitation(uuid, uuid, uuid, text) TO authenticated, service_role;

-- The 2-arg variant is superseded by the 4-arg helper.
DROP FUNCTION IF EXISTS private.assert_proactive_contact_allowed(uuid, uuid);