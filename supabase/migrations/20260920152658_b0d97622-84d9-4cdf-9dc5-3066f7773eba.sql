-- Phase 74 — internal admin notes are not client-readable; report visibility mirrors public visibility.

-- 1) safety_reports: RLS filters rows, not columns. Remove client SELECT entirely.
DROP POLICY IF EXISTS "own safety reports" ON public.safety_reports;
REVOKE SELECT ON public.safety_reports FROM anon, authenticated;
REVOKE ALL ON public.safety_reports FROM anon;
GRANT ALL ON public.safety_reports TO service_role;

-- 2) account_deletion_requests: same — the owner must not read admin_note.
DROP POLICY IF EXISTS "own deletion requests" ON public.account_deletion_requests;
REVOKE SELECT ON public.account_deletion_requests FROM anon, authenticated;
REVOKE ALL ON public.account_deletion_requests FROM anon;
GRANT ALL ON public.account_deletion_requests TO service_role;

-- 3) User-safe read model for the owner (no admin_note, no processing metadata).
CREATE OR REPLACE FUNCTION public.my_account_deletion_request()
RETURNS TABLE(
  id uuid,
  reason text,
  status text,
  requested_at timestamptz,
  updated_at timestamptz,
  processed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  PERFORM public.require_mfa();

  RETURN QUERY
  SELECT r.id, r.reason, r.status, r.requested_at, r.updated_at, r.processed_at
    FROM public.account_deletion_requests r
   WHERE r.user_id = _uid
   ORDER BY r.requested_at DESC
   LIMIT 1;
END;
$$;

-- 4) Admin moderation queue (full internal fields).
CREATE OR REPLACE FUNCTION public.admin_list_account_deletion_requests(_status text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email_snapshot text,
  reason text,
  status text,
  admin_note text,
  requested_at timestamptz,
  updated_at timestamptz,
  processed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;

  RETURN QUERY
  SELECT r.id, r.user_id, r.email_snapshot, r.reason, r.status, r.admin_note,
         r.requested_at, r.updated_at, r.processed_at
    FROM public.account_deletion_requests r
   WHERE (_status IS NULL AND r.status IN ('pending','processing'))
      OR (_status IS NOT NULL AND r.status = _status)
   ORDER BY r.requested_at ASC
   LIMIT 200;
END;
$$;

-- 5) Reporting a listing requires the same visibility the public surface grants,
--    or a real historical engagement with it.
CREATE OR REPLACE FUNCTION public.submit_safety_report(_target_type text, _target_id uuid, _category text, _details text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid; _clean text; _existing uuid; _new uuid; _visible boolean := false; _count int;
BEGIN
  PERFORM public.require_mfa();
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  IF _target_type NOT IN ('job','shift','conversation','message') THEN
    RAISE EXCEPTION 'INVALID_REPORT_TARGET';
  END IF;
  IF _category NOT IN ('misleading','fraud_or_fee','harassment','privacy','unsafe_content','other') THEN
    RAISE EXCEPTION 'INVALID_REPORT_CATEGORY';
  END IF;

  _clean := NULLIF(btrim(COALESCE(_details, '')), '');
  IF _clean IS NOT NULL AND char_length(_clean) > 1000 THEN
    RAISE EXCEPTION 'REPORT_DETAILS_TOO_LONG';
  END IF;

  -- المُبلِّغ يجب أن يملك رؤية مشروعة للعنصر: إمّا أنه معروض فعلاً للعموم
  -- (نفس شروط public_jobs / public_shifts) أو أن له تعاملاً سابقاً معه.
  IF _target_type = 'job' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = _target_id
        AND (
          (
            j.is_active
            AND (j.expires_at IS NULL OR j.expires_at > now())
            AND private.facility_has_live_owner(j.facility_id)
          )
          OR EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id = j.id AND a.user_id = _uid)
          OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.job_id = j.id AND i.professional_user_id = _uid)
          OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.job_id = j.id AND public.is_conversation_participant(c.id, _uid)
          )
        )
    ) INTO _visible;
  ELSIF _target_type = 'shift' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = _target_id
        AND (
          (
            s.status = 'open'
            AND s.starts_at > now()
            AND private.facility_has_live_owner(s.facility_id)
          )
          OR EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.shift_id = s.id AND b.user_id = _uid)
          OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.shift_id = s.id AND i.professional_user_id = _uid)
          OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.shift_id = s.id AND public.is_conversation_participant(c.id, _uid)
          )
        )
    ) INTO _visible;
  ELSIF _target_type = 'conversation' THEN
    _visible := public.is_conversation_participant(_target_id, _uid);
  ELSIF _target_type = 'message' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = _target_id
        AND public.is_conversation_participant(m.conversation_id, _uid)
    ) INTO _visible;
  END IF;

  IF NOT COALESCE(_visible, false) THEN
    RAISE EXCEPTION 'REPORT_TARGET_NOT_VISIBLE';
  END IF;

  SELECT id INTO _existing FROM public.safety_reports
   WHERE reporter_user_id = _uid
     AND target_type = _target_type
     AND target_id = _target_id
     AND category = _category
     AND status IN ('open','reviewing')
   LIMIT 1;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('public.safety_reports.submit:' || _uid::text));

  SELECT count(*) INTO _count FROM public.safety_reports
   WHERE reporter_user_id = _uid AND created_at > now() - interval '1 day';
  IF _count >= 20 THEN RAISE EXCEPTION 'REPORT_QUOTA_EXCEEDED'; END IF;

  INSERT INTO public.safety_reports (reporter_user_id, target_type, target_id, category, details)
  VALUES (_uid, _target_type, _target_id, _category, _clean)
  RETURNING id INTO _new;

  RETURN _new;
END;
$$;

-- 6) Explicit privileges for every function touched (Phase 60 rule).
REVOKE ALL ON FUNCTION public.my_account_deletion_request() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_account_deletion_requests(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_safety_report(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_account_deletion_request() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_account_deletion_requests(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_safety_report(text, uuid, text, text) TO authenticated, service_role;

-- 7) Tracked, tightly guarded cleanup of the single orphan QA fixture
--    (already applied live; these statements are no-ops when it is gone).
DELETE FROM public.conversations c
 WHERE c.professional_user_id = '2bd60a3b-8b2e-4f0a-8d8f-afa920114017'
   AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.professional_user_id);

DELETE FROM public.healthcare_professionals hp
 WHERE hp.user_id = '2bd60a3b-8b2e-4f0a-8d8f-afa920114017'
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = hp.user_id);

DELETE FROM public.profiles p
 WHERE p.id = '2bd60a3b-8b2e-4f0a-8d8f-afa920114017'
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);