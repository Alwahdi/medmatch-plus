-- 1) Location, availability and rate fields on professionals
ALTER TABLE public.healthcare_professionals
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric,
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS search_radius_km integer,
  ADD COLUMN IF NOT EXISTS preferred_rate numeric,
  ADD COLUMN IF NOT EXISTS preferred_rate_period text NOT NULL DEFAULT 'hour';
ALTER TABLE public.healthcare_professionals
  DROP CONSTRAINT IF EXISTS hp_rate_period_check;
ALTER TABLE public.healthcare_professionals
  ADD CONSTRAINT hp_rate_period_check CHECK (preferred_rate_period IN ('hour','day'));

-- 2) Location fields on facilities
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;

-- 3) Push subscriptions (owner-only)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS push_subscriptions_owner ON public.push_subscriptions;
CREATE POLICY push_subscriptions_owner ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) Idempotency log for expiry alerts (service_role only)
CREATE TABLE IF NOT EXISTS public.expiry_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_table text NOT NULL,
  doc_id uuid NOT NULL,
  threshold_days integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doc_table, doc_id, threshold_days)
);
GRANT ALL ON public.expiry_alert_log TO service_role;
ALTER TABLE public.expiry_alert_log ENABLE ROW LEVEL SECURITY;

-- 5) Distance helper — returns kilometres only, never coordinates
CREATE OR REPLACE FUNCTION public.distance_km(_lat1 numeric, _lng1 numeric, _lat2 numeric, _lng2 numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $fn$
  SELECT CASE
    WHEN _lat1 IS NULL OR _lng1 IS NULL OR _lat2 IS NULL OR _lng2 IS NULL THEN NULL
    ELSE round((6371 * 2 * asin(sqrt(
      power(sin(radians((_lat2 - _lat1) / 2)), 2) +
      cos(radians(_lat1)) * cos(radians(_lat2)) *
      power(sin(radians((_lng2 - _lng1) / 2)), 2)
    )))::numeric, 1)
  END
$fn$;
REVOKE ALL ON FUNCTION public.distance_km(numeric,numeric,numeric,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.distance_km(numeric,numeric,numeric,numeric) TO authenticated, service_role;

-- 6) Extend the daily refresh with proactive expiry alerts (30 / 14 / 0 days)
CREATE OR REPLACE FUNCTION public.refresh_verification_expiry()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  _pros int := 0;
  _facs int := 0;
  _alerts int := 0;
  _tmp int := 0;
BEGIN
  WITH upd AS (
    UPDATE public.healthcare_professionals h
       SET is_verified = private.pro_verification_evidence_ok(h.user_id)
                         AND h.verification_suspended_at IS NULL
     WHERE h.is_verified IS DISTINCT FROM (
             private.pro_verification_evidence_ok(h.user_id)
             AND h.verification_suspended_at IS NULL)
    RETURNING 1)
  SELECT count(*) INTO _pros FROM upd;

  WITH upd AS (
    UPDATE public.facilities f
       SET is_verified = private.facility_verification_evidence_ok(f.id)
                         AND f.verification_suspended_at IS NULL
     WHERE f.is_verified IS DISTINCT FROM (
             private.facility_verification_evidence_ok(f.id)
             AND f.verification_suspended_at IS NULL)
    RETURNING 1)
  SELECT count(*) INTO _facs FROM upd;

  -- Professional credential expiry alerts
  WITH due AS (
    SELECT c.id AS doc_id, c.user_id, c.title, c.expiry_date,
           (c.expiry_date - current_date) AS days_left, t.threshold
    FROM public.credentials c
    CROSS JOIN (VALUES (30),(14),(0)) AS t(threshold)
    WHERE c.expiry_date IS NOT NULL
      AND (c.expiry_date - current_date) <= t.threshold
      AND (c.expiry_date - current_date) >  t.threshold - 7
      AND NOT EXISTS (
        SELECT 1 FROM public.expiry_alert_log l
        WHERE l.doc_table = 'credentials' AND l.doc_id = c.id AND l.threshold_days = t.threshold)
  ), ins_log AS (
    INSERT INTO public.expiry_alert_log (doc_table, doc_id, threshold_days)
    SELECT 'credentials', doc_id, threshold FROM due
    ON CONFLICT DO NOTHING
    RETURNING doc_id, threshold_days
  )
  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  SELECT d.user_id, 'credential_expiry',
    CASE WHEN d.days_left <= 0 THEN 'انتهت صلاحية مستند' ELSE 'مستند يقترب من الانتهاء' END,
    CASE WHEN d.days_left <= 0 THEN 'Document expired' ELSE 'Document expiring soon' END,
    'المستند «' || d.title || '»' || CASE WHEN d.days_left <= 0 THEN ' انتهت صلاحيته.' ELSE ' ينتهي خلال ' || d.days_left || ' يوم.' END || ' ارفع مستنداً سارياً للحفاظ على توثيقك.',
    'Your document "' || d.title || '"' || CASE WHEN d.days_left <= 0 THEN ' has expired.' ELSE ' expires in ' || d.days_left || ' days.' END || ' Upload a valid document to keep your verification.',
    '/profile?tab=credentials'
  FROM due d
  JOIN ins_log l ON l.doc_id = d.doc_id AND l.threshold_days = d.threshold;
  GET DIAGNOSTICS _alerts = ROW_COUNT;

  -- Facility document expiry alerts
  WITH due AS (
    SELECT fd.id AS doc_id, f.user_id, fd.title, fd.expiry_date,
           (fd.expiry_date - current_date) AS days_left, t.threshold
    FROM public.facility_documents fd
    JOIN public.facilities f ON f.id = fd.facility_id
    CROSS JOIN (VALUES (30),(14),(0)) AS t(threshold)
    WHERE fd.expiry_date IS NOT NULL AND f.user_id IS NOT NULL
      AND (fd.expiry_date - current_date) <= t.threshold
      AND (fd.expiry_date - current_date) >  t.threshold - 7
      AND NOT EXISTS (
        SELECT 1 FROM public.expiry_alert_log l
        WHERE l.doc_table = 'facility_documents' AND l.doc_id = fd.id AND l.threshold_days = t.threshold)
  ), ins_log AS (
    INSERT INTO public.expiry_alert_log (doc_table, doc_id, threshold_days)
    SELECT 'facility_documents', doc_id, threshold FROM due
    ON CONFLICT DO NOTHING
    RETURNING doc_id, threshold_days
  )
  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  SELECT d.user_id, 'facility_document_expiry',
    CASE WHEN d.days_left <= 0 THEN 'انتهت صلاحية مستند' ELSE 'مستند يقترب من الانتهاء' END,
    CASE WHEN d.days_left <= 0 THEN 'Document expired' ELSE 'Document expiring soon' END,
    'المستند «' || d.title || '»' || CASE WHEN d.days_left <= 0 THEN ' انتهت صلاحيته.' ELSE ' ينتهي خلال ' || d.days_left || ' يوم.' END || ' ارفعوا مستنداً سارياً للحفاظ على توثيق المنشأة.',
    'The document "' || d.title || '"' || CASE WHEN d.days_left <= 0 THEN ' has expired.' ELSE ' expires in ' || d.days_left || ' days.' END || ' Upload a valid document to keep the facility verified.',
    '/facility/verification'
  FROM due d
  JOIN ins_log l ON l.doc_id = d.doc_id AND l.threshold_days = d.threshold;
  GET DIAGNOSTICS _tmp = ROW_COUNT;
  _alerts := _alerts + _tmp;

  RETURN jsonb_build_object(
    'professionals_updated', _pros,
    'facilities_updated', _facs,
    'expiry_alerts_sent', _alerts,
    'ran_at', now());
END;
$fn$;
REVOKE ALL ON FUNCTION public.refresh_verification_expiry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_verification_expiry() TO service_role;

-- 7) Atomic rehire: clone a completed shift and invite the same professional
CREATE OR REPLACE FUNCTION public.rehire_shift(
  _shift_id uuid,
  _starts_at timestamptz,
  _ends_at timestamptz,
  _message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  _src public.shifts%ROWTYPE;
  _new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING errcode = 'P0001';
  END IF;

  SELECT * INTO _src FROM public.shifts WHERE id = _shift_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHIFT_NOT_FOUND' USING errcode = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.id = _src.facility_id AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER' USING errcode = 'P0001';
  END IF;

  IF _src.status NOT IN ('completed','booked') OR _src.booked_by IS NULL THEN
    RAISE EXCEPTION 'SHIFT_NOT_REHIREABLE' USING errcode = 'P0001';
  END IF;

  IF _ends_at <= _starts_at OR _starts_at <= now() THEN
    RAISE EXCEPTION 'INVALID_SHIFT_TIME' USING errcode = 'P0001';
  END IF;

  INSERT INTO public.shifts (
    facility_id, specialty_id, title, notes,
    starts_at, ends_at, hourly_rate, currency,
    country, city, status, is_urgent
  ) VALUES (
    _src.facility_id, _src.specialty_id, _src.title, _src.notes,
    _starts_at, _ends_at, _src.hourly_rate, _src.currency,
    _src.country, _src.city, 'open', false
  ) RETURNING id INTO _new_id;

  PERFORM public.send_candidate_invitation(_src.booked_by, NULL, _new_id, _message);

  RETURN _new_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.rehire_shift(uuid,timestamptz,timestamptz,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rehire_shift(uuid,timestamptz,timestamptz,text) TO authenticated;