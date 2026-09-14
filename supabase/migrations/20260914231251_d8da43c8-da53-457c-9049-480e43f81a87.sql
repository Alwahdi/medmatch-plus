REVOKE ALL ON FUNCTION public.claim_professional_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_professional_role() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.my_sessions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_sessions() TO authenticated, service_role;

ALTER TABLE public.candidate_search_access DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.candidate_search_access FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.candidate_search_access TO service_role;

CREATE OR REPLACE FUNCTION public.admin_data_integrity_report()
RETURNS TABLE (
  entity_type text,
  entity_id uuid,
  issue_code text,
  detail text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  RETURN QUERY
  SELECT 'professional'::text, h.id, 'LOCATION_REVIEW'::text, concat_ws('، ', h.city, h.country)
  FROM public.healthcare_professionals h
  WHERE NOT public.is_known_city_country_valid(h.country, h.city)
  UNION ALL
  SELECT 'facility'::text, f.id, 'LOCATION_REVIEW'::text, concat_ws('، ', f.city, f.country)
  FROM public.facilities f
  WHERE NOT public.is_known_city_country_valid(f.country, f.city)
  UNION ALL
  SELECT 'professional'::text, h.id, 'PROFILE_TEXT_REVIEW'::text, concat_ws(' | ', h.headline, s.name_ar)
  FROM public.healthcare_professionals h
  JOIN public.specialties s ON s.id = h.specialty_id
  WHERE NULLIF(btrim(h.headline), '') IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_data_integrity_report() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_data_integrity_report() TO authenticated, service_role;