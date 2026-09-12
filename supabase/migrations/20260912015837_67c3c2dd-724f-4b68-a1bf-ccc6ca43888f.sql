CREATE OR REPLACE FUNCTION public.claim_facility_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE has_fac boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.facilities WHERE user_id = auth.uid()) INTO has_fac;
  IF NOT has_fac THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'facility')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_facility_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_facility_role() TO authenticated;