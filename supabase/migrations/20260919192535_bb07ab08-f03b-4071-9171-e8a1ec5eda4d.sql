-- 1) credentials / facility_documents: INSERT limited to user-supplied columns (idempotent)
REVOKE INSERT ON public.credentials FROM authenticated;
GRANT INSERT (user_id, doc_type, title, issuer, issue_date, expiry_date, file_path) ON public.credentials TO authenticated;
GRANT ALL ON public.credentials TO service_role;

REVOKE INSERT ON public.facility_documents FROM authenticated;
GRANT INSERT (facility_id, doc_type, title, issuer, issue_date, expiry_date, file_path) ON public.facility_documents TO authenticated;
GRANT ALL ON public.facility_documents TO service_role;

-- 2) jobs: column-level privileges
REVOKE INSERT, UPDATE ON public.jobs FROM authenticated;
GRANT INSERT (facility_id, title, description, specialty_id, employment_type, country, city,
              salary_min, salary_max, currency, min_experience, required_license, vacancies,
              expires_at, is_active) ON public.jobs TO authenticated;
GRANT UPDATE (title, description, specialty_id, employment_type, country, city,
              salary_min, salary_max, currency, min_experience, required_license, vacancies,
              expires_at, is_active) ON public.jobs TO authenticated;
GRANT SELECT, DELETE ON public.jobs TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO service_role;

-- shifts: column-level privileges
REVOKE INSERT, UPDATE ON public.shifts FROM authenticated;
GRANT INSERT (facility_id, specialty_id, title, notes, starts_at, ends_at, hourly_rate,
              currency, country, city) ON public.shifts TO authenticated;
GRANT UPDATE (specialty_id, title, notes, starts_at, ends_at, hourly_rate, currency,
              country, city, status) ON public.shifts TO authenticated;
GRANT SELECT, DELETE ON public.shifts TO authenticated;
GRANT SELECT ON public.shifts TO anon;
GRANT ALL ON public.shifts TO service_role;

-- 3) contact_messages: no direct client insert; go through a validated RPC
DROP POLICY IF EXISTS "anyone can send a contact message" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;

CREATE INDEX IF NOT EXISTS contact_messages_email_created_idx
  ON public.contact_messages (lower(email), created_at DESC);

CREATE OR REPLACE FUNCTION public.submit_contact_message(
  _name text,
  _email text,
  _message text,
  _subject text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(coalesce(_name, ''));
  v_email text := lower(btrim(coalesce(_email, '')));
  v_subject text := nullif(btrim(coalesce(_subject, '')), '');
  v_message text := btrim(coalesce(_message, ''));
  v_recent int;
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RETURN 'invalid_name';
  END IF;
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' OR length(v_email) > 200 THEN
    RETURN 'invalid_email';
  END IF;
  IF length(v_message) < 10 OR length(v_message) > 4000 THEN
    RETURN 'invalid_message';
  END IF;
  IF v_subject IS NOT NULL AND length(v_subject) > 160 THEN
    v_subject := left(v_subject, 160);
  END IF;

  -- duplicate suppression: same sender + same body within 24h
  IF EXISTS (
    SELECT 1 FROM public.contact_messages m
    WHERE lower(m.email) = v_email
      AND m.message = v_message
      AND m.created_at > now() - interval '24 hours'
  ) THEN
    RETURN 'duplicate';
  END IF;

  -- rate limit: at most 3 messages per email per hour
  SELECT count(*) INTO v_recent
  FROM public.contact_messages m
  WHERE lower(m.email) = v_email
    AND m.created_at > now() - interval '1 hour';

  IF v_recent >= 3 THEN
    RETURN 'rate_limited';
  END IF;

  INSERT INTO public.contact_messages (name, email, subject, message)
  VALUES (v_name, v_email, v_subject, v_message);

  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_message(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text, text, text, text) TO anon, authenticated;