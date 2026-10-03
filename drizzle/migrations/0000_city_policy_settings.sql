INSERT INTO public.platform_settings (key, enabled) VALUES
  ('allow_cross_city_listings', false),
  ('professional_own_city_feed', false)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_set_platform_setting(_key text, _enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_admin_mfa();
  IF _key NOT IN ('require_facility_verification','require_professional_verification','allow_cross_city_listings','professional_own_city_feed') THEN
    RAISE EXCEPTION 'UNKNOWN_SETTING';
  END IF;
  INSERT INTO public.platform_settings (key, enabled, updated_by, updated_at)
  VALUES (_key, _enabled, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, updated_by = EXCLUDED.updated_by, updated_at = now();
END; $$;
REVOKE ALL ON FUNCTION public.admin_set_platform_setting(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_platform_setting(text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_listing_facility_location()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE f public.facilities%ROWTYPE;
BEGIN
 SELECT * INTO f FROM public.facilities WHERE id = NEW.facility_id;
 IF f.id IS NULL THEN RAISE EXCEPTION 'LISTING_FACILITY_LOCATION_MISMATCH'; END IF;
 IF public.setting_enabled('allow_cross_city_listings', false) THEN
   IF NOT EXISTS (SELECT 1 FROM public.locations l WHERE l.is_active AND l.city_ar = NEW.city AND public.canonical_country(l.country) = public.canonical_country(NEW.country)) THEN
     RAISE EXCEPTION 'LISTING_FACILITY_LOCATION_MISMATCH';
   END IF;
 ELSIF NEW.city IS DISTINCT FROM f.city OR public.canonical_country(NEW.country) IS DISTINCT FROM public.canonical_country(f.country) THEN
   RAISE EXCEPTION 'LISTING_FACILITY_LOCATION_MISMATCH';
 END IF;
 IF NEW.district_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.districts d JOIN public.locations l ON l.id = d.city_location_id WHERE d.id = NEW.district_id AND d.is_active AND l.is_active AND l.city_ar = NEW.city AND public.canonical_country(l.country) = public.canonical_country(NEW.country)) THEN RAISE EXCEPTION 'INVALID_LISTING_DISTRICT'; END IF;
 RETURN NEW;
END; $function$;