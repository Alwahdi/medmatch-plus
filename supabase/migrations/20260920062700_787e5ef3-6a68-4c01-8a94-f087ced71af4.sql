CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.owner_account_exists(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _user_id);
$$;

REVOKE ALL ON FUNCTION private.owner_account_exists(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owner_account_exists(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.public_jobs AS
  SELECT j.id, j.slug, j.title, j.description, j.specialty_id,
         sp.name_ar AS specialty_name_ar, sp.name_en AS specialty_name_en,
         j.employment_type, j.country, j.city, j.salary_min, j.salary_max, j.currency,
         j.min_experience, j.required_license, j.created_at, j.expires_at, j.is_featured,
         j.facility_verified, j.applications_count, j.vacancies, j.facility_id
    FROM public.jobs j
    JOIN public.facilities f ON f.id = j.facility_id
    LEFT JOIN public.specialties sp ON sp.id = j.specialty_id
   WHERE j.is_active = true
     AND (j.expires_at IS NULL OR j.expires_at > now())
     AND private.owner_account_exists(f.user_id);

CREATE OR REPLACE VIEW public.public_shifts AS
  SELECT s.id, s.title, s.notes, s.specialty_id,
         sp.name_ar AS specialty_name_ar, sp.name_en AS specialty_name_en,
         s.starts_at, s.ends_at, s.hourly_rate, s.currency, s.country, s.city,
         s.status, s.is_urgent, s.facility_verified, s.applications_count,
         s.created_at, s.facility_id
    FROM public.shifts s
    JOIN public.facilities f ON f.id = s.facility_id
    LEFT JOIN public.specialties sp ON sp.id = s.specialty_id
   WHERE s.status = 'open'::shift_status
     AND s.starts_at > now()
     AND private.owner_account_exists(f.user_id);

GRANT SELECT ON public.public_jobs TO anon, authenticated, service_role;
GRANT SELECT ON public.public_shifts TO anon, authenticated, service_role;