CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings readable by authenticated" ON public.platform_settings;
CREATE POLICY "settings readable by authenticated"
  ON public.platform_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.platform_settings (key, enabled) VALUES
  ('require_facility_verification', true),
  ('require_professional_verification', true)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.setting_enabled(_key text, _default boolean DEFAULT true)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT s.enabled FROM public.platform_settings s WHERE s.key = _key), _default);
$$;

REVOKE ALL ON FUNCTION public.setting_enabled(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setting_enabled(text, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_platform_setting(_key text, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_admin_mfa();
  IF _key NOT IN ('require_facility_verification', 'require_professional_verification') THEN
    RAISE EXCEPTION 'UNKNOWN_SETTING';
  END IF;
  INSERT INTO public.platform_settings (key, enabled, updated_by, updated_at)
  VALUES (_key, _enabled, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE
    SET enabled = EXCLUDED.enabled, updated_by = EXCLUDED.updated_by, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_platform_setting(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_platform_setting(text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_listing_requires_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.setting_enabled('require_facility_verification', true) THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.id = NEW.facility_id AND f.is_verified
  ) THEN
    RAISE EXCEPTION 'FACILITY_NOT_VERIFIED';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_engagement_requires_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.setting_enabled('require_professional_verification', true) THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.healthcare_professionals hp
    WHERE hp.user_id = NEW.user_id AND hp.is_verified
  ) THEN
    RAISE EXCEPTION 'PROFESSIONAL_NOT_VERIFIED';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobs_require_verification ON public.jobs;
CREATE TRIGGER trg_jobs_require_verification
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.guard_listing_requires_verification();

DROP TRIGGER IF EXISTS trg_shifts_require_verification ON public.shifts;
CREATE TRIGGER trg_shifts_require_verification
  BEFORE INSERT ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.guard_listing_requires_verification();

DROP TRIGGER IF EXISTS trg_applications_require_verification ON public.applications;
CREATE TRIGGER trg_applications_require_verification
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_engagement_requires_verification();

DROP TRIGGER IF EXISTS trg_bookings_require_verification ON public.shift_bookings;
CREATE TRIGGER trg_bookings_require_verification
  BEFORE INSERT ON public.shift_bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_engagement_requires_verification();