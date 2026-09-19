CREATE OR REPLACE FUNCTION public.guard_owned_media_path()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_path text;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    v_owner := NEW.id;
    v_path := NEW.avatar_url;
  ELSIF TG_TABLE_NAME = 'healthcare_professionals' THEN
    v_owner := NEW.user_id;
    v_path := NEW.avatar_url;
  ELSIF TG_TABLE_NAME = 'facilities' THEN
    v_owner := NEW.user_id;
    v_path := NEW.logo_url;
  ELSE
    RETURN NEW;
  END IF;

  IF v_path IS NULL OR btrim(v_path) = '' THEN
    RETURN NEW;
  END IF;

  IF v_owner IS NULL
     OR v_path ~* '^https?://'
     OR v_path NOT LIKE v_owner::text || '/%' THEN
    RAISE EXCEPTION 'INVALID_MEDIA_PATH';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_owned_media_path() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_owned_media_path() FROM anon;
REVOKE ALL ON FUNCTION public.guard_owned_media_path() FROM authenticated;

DROP TRIGGER IF EXISTS trg_guard_profile_avatar_path ON public.profiles;
CREATE TRIGGER trg_guard_profile_avatar_path
BEFORE INSERT OR UPDATE OF avatar_url ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_owned_media_path();

DROP TRIGGER IF EXISTS trg_guard_professional_avatar_path ON public.healthcare_professionals;
CREATE TRIGGER trg_guard_professional_avatar_path
BEFORE INSERT OR UPDATE OF avatar_url ON public.healthcare_professionals
FOR EACH ROW EXECUTE FUNCTION public.guard_owned_media_path();

DROP TRIGGER IF EXISTS trg_guard_facility_logo_path ON public.facilities;
CREATE TRIGGER trg_guard_facility_logo_path
BEFORE INSERT OR UPDATE OF logo_url ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.guard_owned_media_path();