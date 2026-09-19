-- Phase 27: make current hardening reproducible (idempotent).

-- 1) messages: column-level privileges
REVOKE INSERT, UPDATE ON public.messages FROM authenticated;
GRANT INSERT (conversation_id, sender_id, body, attachment_path, attachment_name, attachment_type, attachment_size) ON public.messages TO authenticated;
GRANT UPDATE (read_at, delivered_at) ON public.messages TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

CREATE OR REPLACE FUNCTION public.guard_message_receipts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL
     OR OLD.sender_id = auth.uid()
     OR NOT public.is_conversation_participant(OLD.conversation_id, auth.uid()) THEN
    RAISE EXCEPTION 'MESSAGE_RECEIPT_FORBIDDEN';
  END IF;

  IF NEW.delivered_at IS DISTINCT FROM OLD.delivered_at THEN
    IF OLD.delivered_at IS NOT NULL THEN
      NEW.delivered_at := OLD.delivered_at;
    ELSIF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := OLD.delivered_at;
    ELSE
      NEW.delivered_at := now();
    END IF;
  END IF;

  IF NEW.read_at IS DISTINCT FROM OLD.read_at THEN
    IF OLD.read_at IS NOT NULL THEN
      NEW.read_at := OLD.read_at;
    ELSIF NEW.read_at IS NULL THEN
      NEW.read_at := OLD.read_at;
    ELSE
      NEW.read_at := now();
      IF NEW.delivered_at IS NULL THEN
        NEW.delivered_at := now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_message_receipts ON public.messages;
CREATE TRIGGER trg_guard_message_receipts
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.guard_message_receipts();

-- 2) conversations: no direct client UPDATE
REVOKE INSERT, UPDATE ON public.conversations FROM authenticated;
GRANT SELECT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

-- 3) invitations: status-only update, enforced transitions + cancellation notice
REVOKE UPDATE ON public.invitations FROM authenticated;
GRANT UPDATE (status) ON public.invitations TO authenticated;
GRANT SELECT, INSERT ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

CREATE OR REPLACE FUNCTION public.on_invitation_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _conv uuid;
  _facility_owner uuid;
  _facility_name text;
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

  IF auth.uid() = OLD.professional_user_id THEN
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
    PERFORM public.push_notification(
      OLD.professional_user_id,
      'invitation_cancelled',
      'تم سحب دعوة',
      'An invitation was withdrawn',
      COALESCE(_facility_name, 'منشأة') || ' سحبت دعوتها لك.',
      'The facility withdrew its invitation.',
      '/invitations'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 4) notifications: read receipt only
REVOKE INSERT, UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
GRANT SELECT, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- 5) profile_change_requests: client insert columns only, no client update
REVOKE INSERT, UPDATE ON public.profile_change_requests FROM authenticated;
GRANT INSERT (user_id, facility_id, target, field, old_value, new_value, reason, attachment_path) ON public.profile_change_requests TO authenticated;
GRANT SELECT ON public.profile_change_requests TO authenticated;
GRANT ALL ON public.profile_change_requests TO service_role;

-- 6) trusted_devices: narrow write surface
REVOKE INSERT, UPDATE ON public.trusted_devices FROM authenticated;
GRANT INSERT (user_id, label, credential_id, user_agent) ON public.trusted_devices TO authenticated;
GRANT UPDATE (label, last_used_at) ON public.trusted_devices TO authenticated;
GRANT SELECT, DELETE ON public.trusted_devices TO authenticated;
GRANT ALL ON public.trusted_devices TO service_role;