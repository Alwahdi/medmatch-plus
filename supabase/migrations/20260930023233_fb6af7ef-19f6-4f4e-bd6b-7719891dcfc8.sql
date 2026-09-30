CREATE OR REPLACE FUNCTION public.lock_verified_facility_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF OLD.is_verified AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.name_ar IS DISTINCT FROM OLD.name_ar
       OR NEW.name_en IS DISTINCT FROM OLD.name_en
       OR NEW.facility_type IS DISTINCT FROM OLD.facility_type
       OR NEW.country IS DISTINCT FROM OLD.country THEN
      RAISE EXCEPTION 'Verified facility identity fields cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;
CREATE OR REPLACE FUNCTION public.lock_verified_pro_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF OLD.is_verified AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name
       OR NEW.license_number IS DISTINCT FROM OLD.license_number
       OR NEW.license_country IS DISTINCT FROM OLD.license_country THEN
      RAISE EXCEPTION 'Verified professional identity fields cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;