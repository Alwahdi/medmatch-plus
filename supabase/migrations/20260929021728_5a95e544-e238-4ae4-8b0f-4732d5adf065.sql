CREATE OR REPLACE FUNCTION public.lock_established_account_location()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NULLIF(btrim(COALESCE(OLD.country, '')), '') IS NOT NULL
     AND NEW.country IS DISTINCT FROM OLD.country THEN
    RAISE EXCEPTION 'LOCATION_CHANGE_REQUIRES_APPROVAL';
  END IF;
  IF NULLIF(btrim(COALESCE(OLD.city, '')), '') IS NOT NULL
     AND NEW.city IS DISTINCT FROM OLD.city THEN
    RAISE EXCEPTION 'LOCATION_CHANGE_REQUIRES_APPROVAL';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lock_established_account_location() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER lock_established_pro_location BEFORE UPDATE OF country, city ON public.healthcare_professionals FOR EACH ROW EXECUTE FUNCTION public.lock_established_account_location();
CREATE TRIGGER lock_established_facility_location BEFORE UPDATE OF country, city ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.lock_established_account_location();
CREATE TRIGGER lock_established_profile_location BEFORE UPDATE OF country, city ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.lock_established_account_location();