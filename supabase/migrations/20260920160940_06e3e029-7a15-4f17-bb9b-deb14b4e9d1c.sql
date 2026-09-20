-- Phase 83 (requested as Phase74): invitation lifecycle follows target availability.

-- Availability check for an invitation target. _lock takes a row lock so a
-- concurrent close cannot leave an actionable accepted invitation behind.
CREATE OR REPLACE FUNCTION private.invitation_target_available(
  _facility_id uuid,
  _job_id uuid,
  _shift_id uuid,
  _lock boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  _ok boolean;
BEGIN
  IF _job_id IS NULL AND _shift_id IS NULL THEN
    RETURN true;
  END IF;

  IF _job_id IS NOT NULL THEN
    IF _lock THEN
      PERFORM 1 FROM public.jobs j WHERE j.id = _job_id FOR UPDATE;
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = _job_id
        AND j.facility_id = _facility_id
        AND j.is_active
        AND (j.expires_at IS NULL OR j.expires_at > now())
    ) INTO _ok;
    RETURN _ok;
  END IF;

  IF _lock THEN
    PERFORM 1 FROM public.shifts s WHERE s.id = _shift_id FOR UPDATE;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = _shift_id
      AND s.facility_id = _facility_id
      AND s.status = 'open'::public.shift_status
      AND s.starts_at > now()
  ) INTO _ok;
  RETURN _ok;
END;
$$;

-- Accept guard + system-cancel path.
CREATE OR REPLACE FUNCTION public.on_invitation_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv uuid;
  _facility_owner uuid;
  _facility_name text;
  _system boolean := COALESCE(current_setting('app.invitation_system_cancel', true), 'off') = 'on';
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status <> 'pending'::public.invitation_status THEN
    RAISE EXCEPTION 'INVITATION_ALREADY_RESOLVED';
  END IF;

  SELECT f.user_id, f.name_ar INTO _facility_owner, _facility_name
  FROM public.facilities f
  WHERE f.id = OLD.facility_id;

  IF _system THEN
    -- Automatic cancellation driven by target closure; only this transition.
    IF NEW.status <> 'cancelled'::public.invitation_status THEN
      RAISE EXCEPTION 'INVALID_INVITATION_TRANSITION';
    END IF;
  ELSIF auth.uid() = OLD.professional_user_id THEN
    IF NEW.status NOT IN ('accepted'::public.invitation_status, 'declined'::public.invitation_status) THEN
      RAISE EXCEPTION 'INVALID_INVITATION_TRANSITION';
    END IF;
  ELSIF auth.uid() = _facility_owner THEN
    IF NEW.status <> 'cancelled'::public.invitation_status THEN
      RAISE EXCEPTION 'INVALID_INVITATION_TRANSITION';
    END IF;
  ELSIF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  NEW.responded_at := now();

  IF NEW.status = 'accepted'::public.invitation_status THEN
    -- The target must still be open at the moment of acceptance, even if the
    -- row has only expired by clock and maintenance has not run yet.
    IF NOT private.invitation_target_available(OLD.facility_id, OLD.job_id, OLD.shift_id, true) THEN
      RAISE EXCEPTION 'INVITATION_TARGET_UNAVAILABLE';
    END IF;

    SELECT c.id INTO _conv
    FROM public.conversations c
    WHERE c.facility_id = OLD.facility_id
      AND c.professional_user_id = OLD.professional_user_id
      AND c.job_id IS NOT DISTINCT FROM OLD.job_id
      AND c.shift_id IS NOT DISTINCT FROM OLD.shift_id
    LIMIT 1;

    IF _conv IS NULL THEN
      INSERT INTO public.conversations (
        facility_id, professional_user_id, job_id, shift_id, subject, identity_revealed
      )
      VALUES (
        OLD.facility_id, OLD.professional_user_id, OLD.job_id, OLD.shift_id, 'قبول دعوة', true
      );
    ELSE
      UPDATE public.conversations
      SET identity_revealed = true
      WHERE id = _conv;
    END IF;
  END IF;

  IF NEW.status = 'cancelled'::public.invitation_status THEN
    -- One notification per invitation row: only pending rows reach this branch.
    PERFORM public.push_notification(
      OLD.professional_user_id,
      'invitation_cancelled',
      'تم سحب دعوة',
      'An invitation was withdrawn',
      CASE
        WHEN _system THEN COALESCE(_facility_name, 'منشأة') || ': لم تعد الفرصة متاحة، وأُلغيت الدعوة.'
        ELSE COALESCE(_facility_name, 'منشأة') || ' سحبت دعوتها لك.'
      END,
      CASE
        WHEN _system THEN 'The opportunity is no longer available, so the invitation was cancelled.'
        ELSE 'The facility withdrew its invitation.'
      END,
      '/invitations'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Auto-cancel pending invitations when a job stops being available.
CREATE OR REPLACE FUNCTION public.cancel_invitations_on_job_unavailable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only explicit closure/expiry edits, never a periodic clock-driven write.
  IF NOT (
    (OLD.is_active AND NOT NEW.is_active)
    OR (NEW.expires_at IS DISTINCT FROM OLD.expires_at AND NEW.expires_at IS NOT NULL AND NEW.expires_at <= now())
  ) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.job_id = NEW.id AND i.status = 'pending'::public.invitation_status
  ) THEN
    PERFORM set_config('app.invitation_system_cancel', 'on', true);
    UPDATE public.invitations
    SET status = 'cancelled'::public.invitation_status
    WHERE job_id = NEW.id AND status = 'pending'::public.invitation_status;
    PERFORM set_config('app.invitation_system_cancel', 'off', true);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_invitations_on_shift_unavailable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (OLD.status = 'open'::public.shift_status AND NEW.status <> 'open'::public.shift_status) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.shift_id = NEW.id AND i.status = 'pending'::public.invitation_status
  ) THEN
    PERFORM set_config('app.invitation_system_cancel', 'on', true);
    UPDATE public.invitations
    SET status = 'cancelled'::public.invitation_status
    WHERE shift_id = NEW.id AND status = 'pending'::public.invitation_status;
    PERFORM set_config('app.invitation_system_cancel', 'off', true);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cancel_invitations_on_job_unavailable ON public.jobs;
CREATE TRIGGER cancel_invitations_on_job_unavailable
AFTER UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.cancel_invitations_on_job_unavailable();

DROP TRIGGER IF EXISTS cancel_invitations_on_shift_unavailable ON public.shifts;
CREATE TRIGGER cancel_invitations_on_shift_unavailable
AFTER UPDATE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.cancel_invitations_on_shift_unavailable();

-- Lock the target while sending so a concurrent close cannot race the insert.
CREATE OR REPLACE FUNCTION public.send_candidate_invitation(
  _professional_user_id uuid,
  _job_id uuid DEFAULT NULL::uuid,
  _shift_id uuid DEFAULT NULL::uuid,
  _message text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
$$;

-- Phase 60 privilege gate: no client-executable surface for the new helpers.
REVOKE ALL ON FUNCTION private.invitation_target_available(uuid, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_invitations_on_job_unavailable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_invitations_on_shift_unavailable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.invitation_target_available(uuid, uuid, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.send_candidate_invitation(uuid, uuid, uuid, text) TO authenticated, service_role;