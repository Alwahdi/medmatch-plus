CREATE OR REPLACE FUNCTION public.is_known_city_country_valid(_country text, _city text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT _country IS NOT NULL AND btrim(_country) <> ''
     AND _city IS NOT NULL AND btrim(_city) <> ''
$$;

GRANT EXECUTE ON FUNCTION public.is_known_city_country_valid(text, text) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.validate_known_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.country IS NULL OR btrim(NEW.country) = '' THEN
    RAISE EXCEPTION 'country_required';
  END IF;
  IF NEW.city IS NULL OR btrim(NEW.city) = '' THEN
    RAISE EXCEPTION 'city_required';
  END IF;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_known_location() TO authenticated, anon, service_role;