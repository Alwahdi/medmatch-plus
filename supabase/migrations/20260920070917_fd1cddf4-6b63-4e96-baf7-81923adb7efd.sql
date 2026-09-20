-- Phase 61: public-view owner helper privacy regression fix (tracked, idempotent)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- Facility-scoped helper: callers can only ask about a known facility id,
-- never about an arbitrary auth user id.
CREATE OR REPLACE FUNCTION private.facility_has_live_owner(_facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.facilities f
    JOIN auth.users u ON u.id = f.user_id
    WHERE f.id = _facility_id
  );
$function$;

REVOKE ALL ON FUNCTION private.facility_has_live_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.facility_has_live_owner(uuid) TO anon, authenticated, service_role;

-- Public views must not expose owner user ids and must filter ownerless facilities.
CREATE OR REPLACE VIEW public.public_jobs AS
SELECT j.id, j.slug, j.title, j.description, j.specialty_id,
       sp.name_ar AS specialty_name_ar, sp.name_en AS specialty_name_en,
       j.employment_type, j.country, j.city, j.salary_min, j.salary_max, j.currency,
       j.min_experience, j.required_license, j.created_at, j.expires_at, j.is_featured,
       j.facility_verified, j.applications_count, j.vacancies, j.facility_id
FROM public.jobs j
LEFT JOIN public.specialties sp ON sp.id = j.specialty_id
WHERE j.is_active = true
  AND (j.expires_at IS NULL OR j.expires_at > now())
  AND private.facility_has_live_owner(j.facility_id);

CREATE OR REPLACE VIEW public.public_shifts AS
SELECT s.id, s.title, s.notes, s.specialty_id,
       sp.name_ar AS specialty_name_ar, sp.name_en AS specialty_name_en,
       s.starts_at, s.ends_at, s.hourly_rate, s.currency, s.country, s.city,
       s.status, s.is_urgent, s.facility_verified, s.applications_count,
       s.created_at, s.facility_id
FROM public.shifts s
LEFT JOIN public.specialties sp ON sp.id = s.specialty_id
WHERE s.status = 'open'::public.shift_status
  AND s.starts_at > now()
  AND private.facility_has_live_owner(s.facility_id);

REVOKE ALL ON public.public_jobs FROM anon, authenticated;
REVOKE ALL ON public.public_shifts FROM anon, authenticated;
GRANT SELECT ON public.public_jobs TO anon, authenticated;
GRANT SELECT ON public.public_shifts TO anon, authenticated;

-- Supersede the Phase 53/56 helper that accepted an arbitrary auth user id.
DROP FUNCTION IF EXISTS private.owner_account_exists(uuid);