CREATE OR REPLACE FUNCTION public.lock_established_professional_specialty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF OLD.specialty_id IS NOT NULL
     AND NEW.specialty_id IS DISTINCT FROM OLD.specialty_id
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'SPECIALTY_CHANGE_REQUIRES_APPROVAL';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lock_established_professional_specialty() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER lock_established_professional_specialty
BEFORE UPDATE OF specialty_id ON public.healthcare_professionals
FOR EACH ROW EXECUTE FUNCTION public.lock_established_professional_specialty();