CREATE OR REPLACE FUNCTION public.lock_verified_facility_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

DROP TRIGGER IF EXISTS lock_verified_facility_identity ON public.facilities;
CREATE TRIGGER lock_verified_facility_identity
BEFORE UPDATE ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.lock_verified_facility_identity();

CREATE OR REPLACE FUNCTION public.lock_verified_pro_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_verified AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name
       OR NEW.license_number IS DISTINCT FROM OLD.license_number
       OR NEW.license_country IS DISTINCT FROM OLD.license_country THEN
      RAISE EXCEPTION 'Verified professional identity fields cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_verified_pro_identity ON public.healthcare_professionals;
CREATE TRIGGER lock_verified_pro_identity
BEFORE UPDATE ON public.healthcare_professionals
FOR EACH ROW EXECUTE FUNCTION public.lock_verified_pro_identity();