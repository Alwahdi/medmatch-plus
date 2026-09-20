-- Phase 56: hide ownerless (demo/seed) listings from the public surface, keep history.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.facility_has_live_owner(_facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.facilities f
    JOIN auth.users u ON u.id = f.user_id
    WHERE f.id = _facility_id
      AND f.user_id IS NOT NULL
  );
$function$;

REVOKE ALL ON FUNCTION private.facility_has_live_owner(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.facility_has_live_owner(uuid) TO anon, authenticated, service_role;

-- Ownerless seed facilities are not verified, and neither are their listings.
UPDATE public.facilities
SET is_verified = false
WHERE user_id IS NULL AND is_verified = true;

UPDATE public.jobs j
SET facility_verified = false
WHERE j.facility_verified = true
  AND NOT private.facility_has_live_owner(j.facility_id);

UPDATE public.shifts s
SET facility_verified = false
WHERE s.facility_verified = true
  AND NOT private.facility_has_live_owner(s.facility_id);

-- Sanitized public surfaces exclude listings without a live owning account.
CREATE OR REPLACE VIEW public.public_jobs AS
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
  AND (j.expires_at IS NULL OR j.expires_at > now())
  AND private.facility_has_live_owner(j.facility_id);

CREATE OR REPLACE VIEW public.public_shifts AS
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
  AND s.starts_at > now()
  AND private.facility_has_live_owner(s.facility_id);

GRANT SELECT ON public.public_jobs TO anon, authenticated, service_role;
GRANT SELECT ON public.public_shifts TO anon, authenticated, service_role;

-- Identity reveal requires a live owning account.
CREATE OR REPLACE FUNCTION public.can_view_facility_identity(_facility_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND _user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.facilities f
      WHERE f.id = _facility_id
        AND f.user_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = f.user_id)
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.facility_id = _facility_id
          AND c.professional_user_id = _user_id
          AND c.identity_revealed
      )
      OR EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE j.facility_id = _facility_id
          AND a.user_id = _user_id
          AND a.status IN ('shortlisted','interview','offer','hired')
      )
      OR EXISTS (
        SELECT 1
        FROM public.shift_bookings b
        JOIN public.shifts s ON s.id = b.shift_id
        WHERE s.facility_id = _facility_id
          AND b.user_id = _user_id
          AND b.status = 'confirmed'
      )
    );
$function$;

REVOKE ALL ON FUNCTION public.can_view_facility_identity(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_facility_identity(uuid, uuid) TO authenticated, service_role;