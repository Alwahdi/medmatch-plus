-- 1) Orphan cleanup (idempotent)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_identities()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _roles int; _notifs int; _devices int; _pros int; _profiles int;
BEGIN
  DELETE FROM public.user_roles ur
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ur.user_id);
  GET DIAGNOSTICS _roles = ROW_COUNT;

  DELETE FROM public.notifications n
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = n.user_id);
  GET DIAGNOSTICS _notifs = ROW_COUNT;

  DELETE FROM public.trusted_devices d
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.user_id);
  GET DIAGNOSTICS _devices = ROW_COUNT;

  -- hide any remaining orphan professional profile from search
  UPDATE public.healthcare_professionals h
     SET is_searchable = false, is_open_to_shifts = false
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = h.user_id)
     AND (h.is_searchable OR h.is_open_to_shifts);

  -- delete only orphan profiles with no business history
  DELETE FROM public.healthcare_professionals h
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = h.user_id)
     AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.user_id = h.user_id)
     AND NOT EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.user_id = h.user_id)
     AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.professional_user_id = h.user_id)
     AND NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.professional_user_id = h.user_id)
     AND NOT EXISTS (SELECT 1 FROM public.invitations i WHERE i.professional_user_id = h.user_id);
  GET DIAGNOSTICS _pros = ROW_COUNT;

  DELETE FROM public.profiles p
   WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.healthcare_professionals h WHERE h.user_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.user_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.user_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.user_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.author_user_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.professional_user_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.sender_id = p.id);
  GET DIAGNOSTICS _profiles = ROW_COUNT;

  RETURN jsonb_build_object(
    'stale_roles_deleted', _roles,
    'orphan_notifications_deleted', _notifs,
    'orphan_devices_deleted', _devices,
    'orphan_professionals_deleted', _pros,
    'orphan_profiles_deleted', _profiles
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_orphaned_identities() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_identities() TO service_role;

SELECT public.cleanup_orphaned_identities();

-- 2) Admin bootstrap: trusted context only
CREATE OR REPLACE FUNCTION public.bootstrap_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'USER_REQUIRED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _user_id) THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_admin_role(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_role(uuid) TO service_role;

-- existing admin may add/remove other admins
CREATE OR REPLACE FUNCTION public.admin_set_admin_role(_user_id uuid, _grant boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'NOT_ADMIN'; END IF;
  IF _user_id IS NULL THEN RAISE EXCEPTION 'USER_REQUIRED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _user_id) THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    IF _user_id = auth.uid() THEN RAISE EXCEPTION 'CANNOT_REMOVE_SELF'; END IF;
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'LAST_ADMIN';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) TO authenticated, service_role;

-- 3) Release readiness report (admin diagnostics)
CREATE OR REPLACE FUNCTION public.release_readiness_report()
RETURNS TABLE(check_code text, severity text, value integer, detail text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'NOT_ADMIN'; END IF;

  RETURN QUERY
  SELECT 'live_admin_count'::text,
         CASE WHEN c = 0 THEN 'blocker' ELSE 'ok' END,
         c::int,
         CASE WHEN c = 0 THEN 'No live admin account. Assign the first admin through the trusted backend procedure.'
              ELSE 'Admin accounts active.' END
  FROM (SELECT count(*) c FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id WHERE ur.role = 'admin') s;

  RETURN QUERY
  SELECT 'orphan_roles'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Role rows whose account no longer exists.'
  FROM (SELECT count(*) c FROM public.user_roles ur LEFT JOIN auth.users u ON u.id = ur.user_id WHERE u.id IS NULL) s;

  RETURN QUERY
  SELECT 'orphan_profiles'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Profiles kept only because they are referenced by business history.'
  FROM (SELECT count(*) c FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL) s;

  RETURN QUERY
  SELECT 'orphan_professionals'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Professional profiles without a live account (hidden from search).'
  FROM (SELECT count(*) c FROM public.healthcare_professionals h LEFT JOIN auth.users u ON u.id = h.user_id WHERE u.id IS NULL) s;

  RETURN QUERY
  SELECT 'professional_role_without_profile'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Accounts holding the professional role with no professional profile.'
  FROM (SELECT count(*) c FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
         WHERE ur.role = 'professional'
           AND NOT EXISTS (SELECT 1 FROM public.healthcare_professionals h WHERE h.user_id = ur.user_id)) s;

  RETURN QUERY
  SELECT 'facility_role_without_profile'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Accounts holding the facility role with no facility profile.'
  FROM (SELECT count(*) c FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
         WHERE ur.role = 'facility'
           AND NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.user_id = ur.user_id)) s;

  RETURN QUERY
  SELECT 'unclaimed_facilities'::text, 'info'::text, c::int,
         'Facilities with no owner account (intentional seed/public listings).'
  FROM (SELECT count(*) c FROM public.facilities WHERE user_id IS NULL) s;

  RETURN QUERY
  SELECT 'test_accounts'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Remaining QA/e2e test accounts.'
  FROM (SELECT count(*) c FROM auth.users WHERE email ILIKE '%@e2e.syndeocare.test') s;
END;
$$;

REVOKE ALL ON FUNCTION public.release_readiness_report() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_readiness_report() TO authenticated, service_role;

-- 4) Justified indexes for FKs / frequent filters
CREATE INDEX IF NOT EXISTS idx_jobs_facility ON public.jobs (facility_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_specialty ON public.jobs (specialty_id);
CREATE INDEX IF NOT EXISTS idx_jobs_public_listing ON public.jobs (is_active, expires_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_facility ON public.shifts (facility_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_specialty ON public.shifts (specialty_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status_start ON public.shifts (status, starts_at);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shift_bookings_user ON public.shift_bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs (job_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_specialty ON public.job_alerts (specialty_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_reviews_facility ON public.reviews (facility_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON public.reviews (professional_user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON public.credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON public.credentials (status);
CREATE INDEX IF NOT EXISTS idx_pros_specialty_search ON public.healthcare_professionals (specialty_id, country, city) WHERE is_searchable;
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_status ON public.profile_change_requests (status, created_at DESC);