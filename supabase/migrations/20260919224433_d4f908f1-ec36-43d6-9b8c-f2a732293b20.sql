CREATE OR REPLACE FUNCTION public.normalize_profile_change_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_text text;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF NEW.attachment_path IS NOT NULL
     AND NEW.attachment_path NOT LIKE auth.uid()::text || '/%' THEN
    RAISE EXCEPTION 'INVALID_ATTACHMENT_PATH';
  END IF;

  IF NEW.target = 'professional' THEN
    IF NEW.facility_id IS NOT NULL THEN RAISE EXCEPTION 'INVALID_REQUEST_TARGET'; END IF;
    SELECT CASE NEW.field
      WHEN 'full_name' THEN hp.full_name
      WHEN 'license_number' THEN hp.license_number
      WHEN 'license_country' THEN hp.license_country
      WHEN 'specialty_id' THEN hp.specialty_id::text
      WHEN 'years_experience' THEN hp.years_experience::text
      WHEN 'city' THEN hp.city
      WHEN 'country' THEN hp.country
      ELSE NULL
    END
    INTO v_text
    FROM public.healthcare_professionals hp
    WHERE hp.user_id = auth.uid();

    IF NOT FOUND OR NEW.field NOT IN (
      'full_name','license_number','license_country','specialty_id',
      'years_experience','city','country'
    ) THEN
      RAISE EXCEPTION 'INVALID_REQUEST_TARGET';
    END IF;

  ELSIF NEW.target = 'facility' THEN
    IF NEW.facility_id IS NULL THEN RAISE EXCEPTION 'INVALID_REQUEST_TARGET'; END IF;
    SELECT CASE NEW.field
      WHEN 'name_ar' THEN f.name_ar
      WHEN 'name_en' THEN f.name_en
      WHEN 'facility_type' THEN f.facility_type
      WHEN 'country' THEN f.country
      WHEN 'city' THEN f.city
      ELSE NULL
    END
    INTO v_text
    FROM public.facilities f
    WHERE f.id = NEW.facility_id
      AND f.user_id = auth.uid();

    IF NOT FOUND OR NEW.field NOT IN ('name_ar','name_en','facility_type','country','city') THEN
      RAISE EXCEPTION 'INVALID_REQUEST_TARGET';
    END IF;

  ELSIF NEW.target = 'account' THEN
    IF NEW.facility_id IS NOT NULL THEN RAISE EXCEPTION 'INVALID_REQUEST_TARGET'; END IF;
    SELECT CASE NEW.field
      WHEN 'full_name' THEN p.full_name
      WHEN 'phone' THEN p.phone
      WHEN 'country' THEN p.country
      WHEN 'city' THEN p.city
      ELSE NULL
    END
    INTO v_text
    FROM public.profiles p
    WHERE p.id = auth.uid();

    IF NOT FOUND OR NEW.field NOT IN ('full_name','phone','country','city') THEN
      RAISE EXCEPTION 'INVALID_REQUEST_TARGET';
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_REQUEST_TARGET';
  END IF;

  NEW.old_value := v_text;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.normalize_profile_change_request() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_normalize_profile_change_request ON public.profile_change_requests;
CREATE TRIGGER trg_normalize_profile_change_request
BEFORE INSERT ON public.profile_change_requests
FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_change_request();