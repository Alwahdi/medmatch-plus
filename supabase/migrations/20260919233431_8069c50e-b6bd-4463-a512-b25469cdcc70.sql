-- Phase 47: sanitized public listing surface + publisher identity privacy

-- 1) Sanitized public views (explicit columns, fixed row filters, no owner/contact data)
DROP VIEW IF EXISTS public.public_jobs;
CREATE VIEW public.public_jobs
WITH (security_invoker = false) AS
SELECT
  j.id,
  j.slug,
  j.title,
  j.description,
  j.specialty_id,
  sp.name_ar AS specialty_name_ar,
  sp.name_en AS specialty_name_en,
  j.employment_type,
  j.country,
  j.city,
  j.salary_min,
  j.salary_max,
  j.currency,
  j.min_experience,
  j.required_license,
  j.created_at,
  j.expires_at,
  j.is_featured,
  j.facility_verified,
  j.applications_count,
  j.vacancies,
  j.facility_id
FROM public.jobs j
LEFT JOIN public.specialties sp ON sp.id = j.specialty_id
WHERE j.is_active = true
  AND (j.expires_at IS NULL OR j.expires_at > now());

DROP VIEW IF EXISTS public.public_shifts;
CREATE VIEW public.public_shifts
WITH (security_invoker = false) AS
SELECT
  s.id,
  s.title,
  s.notes,
  s.specialty_id,
  sp.name_ar AS specialty_name_ar,
  sp.name_en AS specialty_name_en,
  s.starts_at,
  s.ends_at,
  s.hourly_rate,
  s.currency,
  s.country,
  s.city,
  s.status,
  s.is_urgent,
  s.facility_verified,
  s.applications_count,
  s.created_at,
  s.facility_id
FROM public.shifts s
LEFT JOIN public.specialties sp ON sp.id = s.specialty_id
WHERE s.status = 'open'::public.shift_status
  AND s.starts_at > now();

REVOKE ALL ON public.public_jobs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.public_shifts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_jobs TO anon, authenticated;
GRANT SELECT ON public.public_shifts TO anon, authenticated;
GRANT SELECT ON public.public_jobs TO service_role;
GRANT SELECT ON public.public_shifts TO service_role;

-- 2) Anonymous browsing no longer touches the base tables
DROP POLICY IF EXISTS "jobs public read" ON public.jobs;
DROP POLICY IF EXISTS "shifts public read" ON public.shifts;
REVOKE SELECT ON public.jobs FROM anon;
REVOKE SELECT ON public.shifts FROM anon;

-- 3) Authenticated base-table reads: owner / admin / engaged only
CREATE OR REPLACE FUNCTION private.can_read_job_row(_job_id uuid, _facility_id uuid, _is_active boolean, _expires_at timestamp with time zone)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT (SELECT auth.uid()) IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=(SELECT auth.uid()) AND ur.role='admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id=_facility_id AND f.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id=_job_id AND a.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.saved_jobs sj WHERE sj.job_id=_job_id AND sj.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.job_id=_job_id AND i.professional_user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.job_id=_job_id AND c.professional_user_id=(SELECT auth.uid()))
  );
$function$;

CREATE OR REPLACE FUNCTION private.can_read_shift_row(_shift_id uuid, _facility_id uuid, _status public.shift_status, _starts_at timestamp with time zone)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT (SELECT auth.uid()) IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=(SELECT auth.uid()) AND ur.role='admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id=_facility_id AND f.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.shift_id=_shift_id AND b.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.shift_id=_shift_id AND i.professional_user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.shift_id=_shift_id AND c.professional_user_id=(SELECT auth.uid()))
  );
$function$;

REVOKE ALL ON FUNCTION private.can_read_job_row(uuid, uuid, boolean, timestamp with time zone) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_read_shift_row(uuid, uuid, public.shift_status, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_read_job_row(uuid, uuid, boolean, timestamp with time zone) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_read_shift_row(uuid, uuid, public.shift_status, timestamp with time zone) TO authenticated, service_role;