CREATE OR REPLACE FUNCTION public.review_change_request(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r public.profile_change_requests%ROWTYPE;
  v text;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF length(COALESCE(_note, '')) > 1000 THEN
    RAISE EXCEPTION 'NOTE_TOO_LONG';
  END IF;

  SELECT * INTO r
  FROM public.profile_change_requests
  WHERE id = _id
  FOR UPDATE;

  IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'ALREADY_REVIEWED'; END IF;

  IF NOT (
    (r.target = 'professional' AND r.facility_id IS NULL
      AND r.field IN ('full_name','license_number','license_country','specialty_id','years_experience','city','country')
      AND EXISTS (SELECT 1 FROM public.healthcare_professionals hp WHERE hp.user_id = r.user_id))
    OR
    (r.target = 'facility'
      AND r.field IN ('name_ar','name_en','facility_type','country','city')
      AND r.facility_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = r.facility_id AND f.user_id = r.user_id))
    OR
    (r.target = 'account' AND r.facility_id IS NULL
      AND r.field IN ('full_name','phone','country','city'))
  ) THEN
    RAISE EXCEPTION 'INVALID_REQUEST_TARGET';
  END IF;

  IF _approve THEN
    v := btrim(COALESCE(r.new_value, ''));

    -- تحقق نوعي صريح لكل حقل قبل أي تحديث
    IF r.field = 'years_experience' THEN
      IF v !~ '^([0-9]|[1-5][0-9]|60)$' THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
    ELSIF r.field = 'specialty_id' THEN
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE id = v::uuid) THEN
          RAISE EXCEPTION 'INVALID_SPECIALTY';
        END IF;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'INVALID_SPECIALTY';
      END;
    ELSIF r.field = 'facility_type' THEN
      IF v NOT IN ('hospital','clinic','polyclinic','pharmacy','lab') THEN
        RAISE EXCEPTION 'INVALID_FACILITY_TYPE';
      END IF;
    ELSIF r.field = 'full_name' THEN
      IF length(v) < 2 OR length(v) > 100 THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
    ELSIF r.field IN ('name_ar','name_en') THEN
      IF length(v) < 2 OR length(v) > 120 THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
    ELSIF r.field IN ('city','country','license_country') THEN
      IF length(v) < 2 OR length(v) > 60 THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
    ELSIF r.field = 'license_number' THEN
      IF length(v) < 1 OR length(v) > 60 THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
    ELSIF r.field = 'phone' THEN
      IF length(v) < 5 OR length(v) > 30 THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
    END IF;

    IF r.target = 'professional' THEN
      IF r.field = 'years_experience' THEN
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1::integer WHERE user_id = $2', r.field)
          USING v, r.user_id;
      ELSIF r.field = 'specialty_id' THEN
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1::uuid WHERE user_id = $2', r.field)
          USING v, r.user_id;
      ELSE
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1 WHERE user_id = $2', r.field)
          USING v, r.user_id;
      END IF;
      IF r.field = 'full_name' THEN
        UPDATE public.profiles SET full_name = v WHERE id = r.user_id;
      END IF;

    ELSIF r.target = 'facility' THEN
      EXECUTE format('UPDATE public.facilities SET %I = $1 WHERE id = $2', r.field)
        USING v, r.facility_id;

    ELSE
      EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', r.field)
        USING v, r.user_id;
    END IF;
  END IF;

  UPDATE public.profile_change_requests
  SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
      review_note = NULLIF(btrim(COALESCE(_note, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = _id;

  PERFORM public.push_notification(
    r.user_id,
    'change_request',
    CASE WHEN _approve THEN 'تم قبول طلب تعديل بياناتك' ELSE 'تم رفض طلب تعديل بياناتك' END,
    CASE WHEN _approve THEN 'Data change request approved' ELSE 'Data change request rejected' END,
    COALESCE(NULLIF(btrim(COALESCE(_note, '')), ''), r.field),
    COALESCE(NULLIF(btrim(COALESCE(_note, '')), ''), r.field),
    CASE WHEN r.target = 'facility' THEN '/facility/profile' ELSE '/profile' END
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.review_change_request(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_change_request(uuid, boolean, text) TO authenticated, service_role;