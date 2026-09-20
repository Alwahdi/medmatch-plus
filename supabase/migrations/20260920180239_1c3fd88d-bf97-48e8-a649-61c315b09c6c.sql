-- ===== 1) Identity-bearing base columns are no longer client-readable =====
REVOKE SELECT ON public.jobs FROM authenticated;
GRANT SELECT (
  id, facility_id, title, description, specialty_id, employment_type, country, city,
  salary_min, salary_max, currency, min_experience, required_license, is_active,
  created_at, updated_at, is_featured, expires_at, applications_count,
  facility_verified, slug, vacancies, auto_closed
) ON public.jobs TO authenticated;

REVOKE SELECT ON public.shifts FROM authenticated;
GRANT SELECT (
  id, facility_id, specialty_id, title, notes, starts_at, ends_at, hourly_rate,
  currency, country, city, status, created_at, updated_at, is_urgent,
  applications_count, facility_verified
) ON public.shifts TO authenticated;

GRANT ALL ON public.jobs TO service_role;
GRANT ALL ON public.shifts TO service_role;

-- ===== 2) Saving a listing is bookmarking, not privileged history access =====
CREATE OR REPLACE FUNCTION private.can_read_job_row(
  _job_id uuid, _facility_id uuid, _is_active boolean, _expires_at timestamp with time zone
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT (SELECT auth.uid()) IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=(SELECT auth.uid()) AND ur.role='admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id=_facility_id AND f.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id=_job_id AND a.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.job_id=_job_id AND i.professional_user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.job_id=_job_id AND c.professional_user_id=(SELECT auth.uid()))
  );
$function$;

-- ===== 3) Sanitized self-history for saved jobs (no identity fields) =====
CREATE OR REPLACE FUNCTION public.my_saved_jobs()
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  country text,
  city text,
  salary_min numeric,
  salary_max numeric,
  currency text,
  employment_type public.employment_type,
  min_experience integer,
  created_at timestamptz,
  expires_at timestamptz,
  is_featured boolean,
  facility_verified boolean,
  applications_count integer,
  specialty_name_ar text,
  specialty_name_en text,
  is_available boolean,
  saved_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    j.id, j.slug, j.title, j.country, j.city, j.salary_min, j.salary_max, j.currency,
    j.employment_type, j.min_experience, j.created_at, j.expires_at, j.is_featured,
    j.facility_verified, j.applications_count,
    s.name_ar, s.name_en,
    (j.is_active AND (j.expires_at IS NULL OR j.expires_at > now())) AS is_available,
    sj.created_at AS saved_at
  FROM public.saved_jobs sj
  JOIN public.jobs j ON j.id = sj.job_id
  LEFT JOIN public.specialties s ON s.id = j.specialty_id
  WHERE sj.user_id = (SELECT auth.uid())
  ORDER BY sj.created_at DESC
$function$;

REVOKE ALL ON FUNCTION public.my_saved_jobs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_saved_jobs() TO authenticated, service_role;