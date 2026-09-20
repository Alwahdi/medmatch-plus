-- Phase 67: trusted, service-role-only contact submission with atomic abuse limits

CREATE OR REPLACE FUNCTION public.submit_contact_message_internal(
  _name text,
  _email text,
  _message text,
  _subject text DEFAULT NULL::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name text := btrim(coalesce(_name, ''));
  v_email text := lower(btrim(coalesce(_email, '')));
  v_subject text := nullif(btrim(coalesce(_subject, '')), '');
  v_message text := btrim(coalesce(_message, ''));
  v_recent int;
  v_global int;
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RETURN 'invalid_name';
  END IF;
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' OR length(v_email) > 200 THEN
    RETURN 'invalid_email';
  END IF;
  IF length(v_message) < 10 OR length(v_message) > 2000 THEN
    RETURN 'invalid_message';
  END IF;
  IF v_subject IS NOT NULL AND length(v_subject) > 160 THEN
    v_subject := left(v_subject, 160);
  END IF;

  -- Serialize count+insert so concurrent submits cannot slip past the caps.
  PERFORM pg_advisory_xact_lock(hashtext('public.contact_messages.submit'));

  -- duplicate suppression: same sender + same body within 24h
  IF EXISTS (
    SELECT 1 FROM public.contact_messages m
    WHERE lower(m.email) = v_email
      AND m.message = v_message
      AND m.created_at > now() - interval '24 hours'
  ) THEN
    RETURN 'duplicate';
  END IF;

  -- per-email rate limit: at most 3 messages per hour
  SELECT count(*) INTO v_recent
  FROM public.contact_messages m
  WHERE lower(m.email) = v_email
    AND m.created_at > now() - interval '1 hour';

  IF v_recent >= 3 THEN
    RETURN 'rate_limited';
  END IF;

  -- global circuit breaker: protects the inbox from random-email floods
  SELECT count(*) INTO v_global
  FROM public.contact_messages m
  WHERE m.created_at > now() - interval '10 minutes';

  IF v_global >= 30 THEN
    RETURN 'rate_limited';
  END IF;

  INSERT INTO public.contact_messages (name, email, subject, message)
  VALUES (v_name, v_email, v_subject, v_message);

  RETURN 'ok';
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_contact_message_internal(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact_message_internal(text, text, text, text) TO service_role;

-- The browser no longer calls the legacy RPC directly.
REVOKE ALL ON FUNCTION public.submit_contact_message(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text, text, text, text) TO service_role;