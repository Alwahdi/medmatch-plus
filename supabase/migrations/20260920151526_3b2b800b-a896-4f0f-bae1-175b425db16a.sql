-- Phase 72 — trusted, recipient-only, server-timestamped message receipts.

-- 1) Remove the client's ability to write receipt columns directly.
DROP POLICY IF EXISTS "participants mark read" ON public.messages;
REVOKE UPDATE ON public.messages FROM anon, authenticated;
REVOKE UPDATE (read_at, delivered_at) ON public.messages FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.messages FROM anon, authenticated;
GRANT ALL ON public.messages TO service_role;

-- 2) Index supporting the "incoming undelivered" scan.
CREATE INDEX IF NOT EXISTS messages_undelivered_idx
  ON public.messages (conversation_id, sender_id)
  WHERE delivered_at IS NULL;

-- 3) Mark every incoming message in one conversation as read (server time).
CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _n integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  PERFORM public.require_mfa();

  IF NOT public.is_conversation_participant(_conversation_id, _uid) THEN
    RAISE EXCEPTION 'NOT_A_PARTICIPANT';
  END IF;

  UPDATE public.messages m
     SET read_at = now(),
         delivered_at = COALESCE(m.delivered_at, now())
   WHERE m.conversation_id = _conversation_id
     AND m.sender_id <> _uid
     AND m.read_at IS NULL;

  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

-- 4) Mark incoming messages of every conversation the caller belongs to as delivered.
CREATE OR REPLACE FUNCTION public.mark_incoming_messages_delivered()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _n integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  PERFORM public.require_mfa();

  UPDATE public.messages m
     SET delivered_at = now()
   WHERE m.delivered_at IS NULL
     AND m.sender_id <> _uid
     AND m.conversation_id IN (
       SELECT c.id
       FROM public.conversations c
       LEFT JOIN public.facilities f ON f.id = c.facility_id
       WHERE c.professional_user_id = _uid OR f.user_id = _uid
     );

  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

-- 5) Explicit privileges (Phase 60 rule).
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_incoming_messages_delivered() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_incoming_messages_delivered() TO authenticated, service_role;