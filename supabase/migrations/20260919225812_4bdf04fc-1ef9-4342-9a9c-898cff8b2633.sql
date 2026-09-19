CREATE OR REPLACE FUNCTION public.normalize_facility_website()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v text;
BEGIN
  v := NULLIF(btrim(COALESCE(NEW.website, '')), '');
  IF v IS NULL THEN
    NEW.website := NULL;
    RETURN NEW;
  END IF;

  IF length(v) > 300 THEN
    RAISE EXCEPTION 'WEBSITE_TOO_LONG';
  END IF;

  -- Reject explicit non-HTTP schemes; otherwise make bare domains convenient.
  IF v ~* '^[a-z][a-z0-9+.-]*:' AND v !~* '^https?://' THEN
    RAISE EXCEPTION 'WEBSITE_INVALID';
  END IF;

  IF v !~* '^https?://' THEN
    v := 'https://' || v;
  END IF;

  IF v !~* '^https?://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'WEBSITE_INVALID';
  END IF;

  NEW.website := v;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.normalize_facility_website() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.normalize_facility_website() FROM anon;
REVOKE ALL ON FUNCTION public.normalize_facility_website() FROM authenticated;

DROP TRIGGER IF EXISTS trg_normalize_facility_website ON public.facilities;
CREATE TRIGGER trg_normalize_facility_website
BEFORE INSERT OR UPDATE OF website ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.normalize_facility_website();