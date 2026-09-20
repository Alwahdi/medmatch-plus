CREATE OR REPLACE FUNCTION public.release_readiness_report()
 RETURNS TABLE(check_code text, severity text, value integer, detail text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_mfa();
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

  -- Ownerless facilities are historical/seed rows. Since Phase 56 they are excluded
  -- from every public listing view, so they are informational, never a blocker by themselves.
  RETURN QUERY
  SELECT 'unclaimed_facilities'::text, 'info'::text, c::int,
         'Ownerless historical/seed facility records retained for business history and excluded from public listing views.'
  FROM (SELECT count(*) c FROM public.facilities WHERE user_id IS NULL) s;

  -- A leak of an ownerless record into the public views is a blocker.
  RETURN QUERY
  SELECT 'ownerless_public_jobs'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Jobs from ownerless facilities visible in the public jobs view (must be zero).'
  FROM (
    SELECT count(*) c FROM public.public_jobs pj
    JOIN public.facilities f ON f.id = pj.facility_id
    WHERE f.user_id IS NULL
  ) s;

  RETURN QUERY
  SELECT 'ownerless_public_shifts'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Shifts from ownerless facilities visible in the public shifts view (must be zero).'
  FROM (
    SELECT count(*) c FROM public.public_shifts ps
    JOIN public.facilities f ON f.id = ps.facility_id
    WHERE f.user_id IS NULL
  ) s;

  RETURN QUERY
  SELECT 'verified_fac_without_required_docs'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Facilities flagged verified without both approved core documents (facility licence and commercial register).'
  FROM (
    SELECT count(*) c FROM public.facilities f
    WHERE f.is_verified
      AND (
        SELECT count(DISTINCT d.doc_type) FROM public.facility_documents d
        WHERE d.facility_id = f.id AND d.status = 'approved'
          AND d.doc_type IN ('رخصة مزاولة المنشأة', 'السجل التجاري')
      ) < 2
  ) s;

  RETURN QUERY
  SELECT 'verified_pro_without_required_docs'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Professionals flagged verified without both approved core credentials (practice licence and identity document).'
  FROM (
    SELECT count(*) c FROM public.healthcare_professionals h
    WHERE h.is_verified
      AND (
        SELECT count(DISTINCT cr.doc_type) FROM public.credentials cr
        WHERE cr.user_id = h.user_id AND cr.status = 'approved'
          AND cr.doc_type IN ('ترخيص مزاولة المهنة', 'بطاقة الهوية / الجواز')
      ) < 2
  ) s;

  RETURN QUERY
  SELECT 'both_domain_profiles'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Accounts holding both a professional and a facility profile (one account type per user).'
  FROM (
    SELECT count(*) c FROM public.healthcare_professionals h
    WHERE EXISTS (SELECT 1 FROM public.facilities f WHERE f.user_id = h.user_id)
  ) s;

  RETURN QUERY
  SELECT 'invalid_shift_duration'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Shifts whose end time is not after the start time or longer than 24 hours.'
  FROM (
    SELECT count(*) c FROM public.shifts
    WHERE ends_at <= starts_at OR ends_at > starts_at + interval '24 hours'
  ) s;

  RETURN QUERY
  SELECT 'dangerous_client_privileges'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Client roles holding TRUNCATE/TRIGGER/REFERENCES/MAINTAIN or any write privilege for anon on public tables.'
  FROM (
    SELECT count(*) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE (r.rolname IN ('anon','authenticated') AND a.privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES','MAINTAIN'))
       OR (r.rolname = 'anon' AND a.privilege_type IN ('INSERT','UPDATE','DELETE'))
  ) s;

  RETURN QUERY
  SELECT 'client_tables_without_rls'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Public tables reachable by client roles without row level security enabled.'
  FROM (
    SELECT count(DISTINCT cl.oid) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE cl.relkind = 'r' AND NOT cl.relrowsecurity AND r.rolname IN ('anon','authenticated')
  ) s;

  RETURN QUERY
  SELECT 'test_accounts'::text, CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Remaining QA/e2e test accounts.'
  FROM (SELECT count(*) c FROM auth.users WHERE email ILIKE '%@e2e.syndeocare.test') s;
END;
$function$;

REVOKE ALL ON FUNCTION public.release_readiness_report() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_readiness_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_readiness_report() TO service_role;