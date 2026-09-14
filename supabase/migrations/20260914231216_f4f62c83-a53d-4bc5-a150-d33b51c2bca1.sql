CREATE TABLE public.candidate_search_access (
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  professional_user_id uuid NOT NULL,
  last_searched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (facility_id, professional_user_id)
);
GRANT ALL ON public.candidate_search_access TO service_role;
ALTER TABLE public.candidate_search_access ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.healthcare_professionals
  ADD COLUMN IF NOT EXISTS is_searchable boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.search_candidates_atomic(
  _specialty_id uuid DEFAULT NULL,
  _country text DEFAULT NULL,
  _city text DEFAULT NULL,
  _min_experience integer DEFAULT NULL,
  _limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  headline text,
  specialty_id uuid,
  years_experience integer,
  country text,
  city text,
  bio text,
  is_open_to_shifts boolean,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _facility uuid;
  _quota integer;
  _used integer;
BEGIN
  SELECT f.id INTO _facility
  FROM public.facilities f
  WHERE f.user_id = auth.uid()
  LIMIT 1;

  IF _facility IS NULL THEN
    RAISE EXCEPTION 'NOT_A_FACILITY';
  END IF;

  SELECT p.candidate_searches, s.searches_used
  INTO _quota, _used
  FROM public.facility_subscriptions s
  JOIN public.subscription_plans p ON p.code = s.plan_code
  WHERE s.facility_id = _facility
    AND s.status IN ('active', 'trialing')
    AND s.ends_at > now()
  FOR UPDATE OF s
  LIMIT 1;

  IF _quota IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION';
  END IF;
  IF _quota >= 0 AND _used >= _quota THEN
    RAISE EXCEPTION 'SEARCH_QUOTA_EXCEEDED';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS pg_temp.candidate_search_result (
    id uuid,
    user_id uuid,
    headline text,
    specialty_id uuid,
    years_experience integer,
    country text,
    city text,
    bio text,
    is_open_to_shifts boolean,
    is_verified boolean
  ) ON COMMIT DROP;
  TRUNCATE pg_temp.candidate_search_result;

  INSERT INTO pg_temp.candidate_search_result
  SELECT h.id, h.user_id, h.headline, h.specialty_id, h.years_experience,
         h.country, h.city, h.bio, h.is_open_to_shifts, h.is_verified
  FROM public.healthcare_professionals h
  WHERE h.is_searchable
    AND (_specialty_id IS NULL OR h.specialty_id = _specialty_id)
    AND (_country IS NULL OR h.country = _country)
    AND (_city IS NULL OR h.city = _city)
    AND (_min_experience IS NULL OR h.years_experience >= _min_experience)
  ORDER BY h.is_verified DESC, h.years_experience DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 20), 1), 50);

  INSERT INTO public.candidate_search_access (facility_id, professional_user_id, last_searched_at)
  SELECT _facility, r.user_id, now()
  FROM pg_temp.candidate_search_result r
  ON CONFLICT (facility_id, professional_user_id)
  DO UPDATE SET last_searched_at = EXCLUDED.last_searched_at;

  UPDATE public.facility_subscriptions
  SET searches_used = searches_used + 1,
      updated_at = now()
  WHERE facility_id = _facility;

  RETURN QUERY
  SELECT r.id, r.user_id, r.headline, r.specialty_id, r.years_experience,
         r.country, r.city, r.bio, r.is_open_to_shifts, r.is_verified
  FROM pg_temp.candidate_search_result r;
END;
$$;
REVOKE ALL ON FUNCTION public.search_candidates_atomic(uuid, text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_candidates_atomic(uuid, text, text, integer, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.search_candidates(uuid, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_candidate_search() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_candidate_conversation(
  _professional_user_id uuid,
  _job_id uuid DEFAULT NULL,
  _shift_id uuid DEFAULT NULL,
  _subject text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _facility uuid;
  _conversation uuid;
  _allowed boolean;
BEGIN
  SELECT f.id INTO _facility
  FROM public.facilities f
  WHERE f.user_id = auth.uid()
  LIMIT 1;

  IF _facility IS NULL THEN
    RAISE EXCEPTION 'NOT_A_FACILITY';
  END IF;

  SELECT (
    EXISTS (
      SELECT 1 FROM public.candidate_search_access a
      WHERE a.facility_id = _facility
        AND a.professional_user_id = _professional_user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE j.facility_id = _facility
        AND a.user_id = _professional_user_id
        AND (_job_id IS NULL OR a.job_id = _job_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.shift_bookings b
      JOIN public.shifts s ON s.id = b.shift_id
      WHERE s.facility_id = _facility
        AND b.user_id = _professional_user_id
        AND (_shift_id IS NULL OR b.shift_id = _shift_id)
    )
  ) INTO _allowed;

  IF NOT COALESCE(_allowed, false) THEN
    RAISE EXCEPTION 'CANDIDATE_CONTACT_NOT_ALLOWED';
  END IF;

  SELECT c.id INTO _conversation
  FROM public.conversations c
  WHERE c.facility_id = _facility
    AND c.professional_user_id = _professional_user_id
    AND c.job_id IS NOT DISTINCT FROM _job_id
    AND c.shift_id IS NOT DISTINCT FROM _shift_id
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF _conversation IS NOT NULL THEN
    RETURN _conversation;
  END IF;

  INSERT INTO public.conversations (
    facility_id, professional_user_id, job_id, shift_id, subject, identity_revealed
  ) VALUES (
    _facility, _professional_user_id, _job_id, _shift_id,
    NULLIF(btrim(_subject), ''), true
  )
  RETURNING id INTO _conversation;

  RETURN _conversation;
END;
$$;
REVOKE ALL ON FUNCTION public.start_candidate_conversation(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_candidate_conversation(uuid, uuid, uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "facility starts conversation" ON public.conversations;
REVOKE INSERT ON public.conversations FROM authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_shift_booking(_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _shift_id uuid;
BEGIN
  SELECT b.shift_id INTO _shift_id
  FROM public.shift_bookings b
  WHERE b.id = _booking_id
    AND b.user_id = auth.uid()
  FOR UPDATE;

  IF _shift_id IS NULL THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  DELETE FROM public.shift_bookings
  WHERE id = _booking_id AND user_id = auth.uid();

  UPDATE public.shifts
  SET status = 'open', booked_by = NULL, updated_at = now()
  WHERE id = _shift_id
    AND status = 'booked'
    AND booked_by = auth.uid();

  RETURN _shift_id;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_my_shift_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_shift_booking(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_known_city_country_valid(_country text, _city text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN NULLIF(btrim(COALESCE(_country, '')), '') IS NULL
      OR NULLIF(btrim(COALESCE(_city, '')), '') IS NULL THEN true
    WHEN btrim(_city) IN ('صنعاء','صعدة','عدن','كريتر','المعلا','تعز','المخا','الحديدة','باجل','المكلا','سيئون','إب','جبلة','ذمار','مأرب','لحج','الحوطة','زنجبار','عتق','عمران','حجة','الغيظة','حديبو')
      THEN btrim(_country) = 'اليمن'
    WHEN btrim(_city) IN ('الرياض','الخرج','الدوادمي','جدة','مكة المكرمة','الطائف','الدمام','الخبر','الأحساء','الجبيل','المدينة المنورة','ينبع','أبها','خميس مشيط')
      THEN btrim(_country) IN ('السعودية','المملكة العربية السعودية')
    WHEN btrim(_city) IN ('دبي','جبل علي','أبوظبي','العين','الشارقة','عجمان')
      THEN btrim(_country) IN ('الإمارات','الإمارات العربية المتحدة')
    WHEN btrim(_city) IN ('القاهرة','مدينة نصر','المعادي','مصر الجديدة','التجمع الخامس','وسط البلد','الجيزة','الدقي','المهندسين','6 أكتوبر','الشيخ زايد','الإسكندرية','سموحة','سيدي جابر','المنتزه','المنصورة','ميت غمر')
      THEN btrim(_country) = 'مصر'
    ELSE true
  END;
$$;
REVOKE ALL ON FUNCTION public.is_known_city_country_valid(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_known_city_country_valid(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.validate_known_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_known_city_country_valid(NEW.country, NEW.city) THEN
    RAISE EXCEPTION 'INVALID_CITY_COUNTRY';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_known_location() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS validate_professional_location ON public.healthcare_professionals;
CREATE TRIGGER validate_professional_location
BEFORE INSERT OR UPDATE OF country, city ON public.healthcare_professionals
FOR EACH ROW EXECUTE FUNCTION public.validate_known_location();

DROP TRIGGER IF EXISTS validate_facility_location ON public.facilities;
CREATE TRIGGER validate_facility_location
BEFORE INSERT OR UPDATE OF country, city ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.validate_known_location();

DROP TRIGGER IF EXISTS validate_job_location ON public.jobs;
CREATE TRIGGER validate_job_location
BEFORE INSERT OR UPDATE OF country, city ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.validate_known_location();

DROP TRIGGER IF EXISTS validate_shift_location ON public.shifts;
CREATE TRIGGER validate_shift_location
BEFORE INSERT OR UPDATE OF country, city ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.validate_known_location();

DROP TRIGGER IF EXISTS validate_alert_location ON public.job_alerts;
CREATE TRIGGER validate_alert_location
BEFORE INSERT OR UPDATE OF country, city ON public.job_alerts
FOR EACH ROW EXECUTE FUNCTION public.validate_known_location();

CREATE OR REPLACE FUNCTION public.admin_data_integrity_report()
RETURNS TABLE (
  entity_type text,
  entity_id uuid,
  issue_code text,
  detail text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'professional', h.id, 'LOCATION_REVIEW', concat_ws('، ', h.city, h.country)
  FROM public.healthcare_professionals h
  WHERE NOT public.is_known_city_country_valid(h.country, h.city)
  UNION ALL
  SELECT 'facility', f.id, 'LOCATION_REVIEW', concat_ws('، ', f.city, f.country)
  FROM public.facilities f
  WHERE NOT public.is_known_city_country_valid(f.country, f.city)
  UNION ALL
  SELECT 'professional', h.id, 'PROFILE_TEXT_REVIEW', concat_ws(' | ', h.headline, s.name_ar)
  FROM public.healthcare_professionals h
  LEFT JOIN public.specialties s ON s.id = h.specialty_id
  WHERE h.headline IS NOT NULL
    AND s.id IS NOT NULL
    AND length(btrim(h.headline)) > 0;
$$;
REVOKE ALL ON FUNCTION public.admin_data_integrity_report() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_data_integrity_report() TO authenticated, service_role;