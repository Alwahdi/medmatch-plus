-- Phase 98: trigger functions are internal-only
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
    WHERE p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.release_privilege_audit()
 RETURNS TABLE(check_code text, severity text, value integer, detail text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'NOT_ADMIN'; END IF;

  RETURN QUERY
  SELECT 'client_non_client_privileges'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'anon/authenticated holding TRUNCATE, TRIGGER, REFERENCES or MAINTAIN on public objects.'
  FROM (
    SELECT count(*) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE r.rolname IN ('anon','authenticated')
      AND a.privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES','MAINTAIN')
  ) s;

  RETURN QUERY
  SELECT 'anon_write_privileges'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Anonymous write privileges on public tables (allowlist is intentionally empty; public writes use RPCs).'
  FROM (
    SELECT count(*) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE r.rolname = 'anon' AND a.privilege_type IN ('INSERT','UPDATE','DELETE')
  ) s;

  RETURN QUERY
  SELECT 'anon_table_allowlist'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Anon privileges on public tables/views outside the documented allowlist (public_jobs, public_shifts, specialties).'
  FROM (
    SELECT count(*) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE r.rolname = 'anon'
      AND cl.relname NOT IN ('public_jobs','public_shifts','specialties')
  ) s;

  RETURN QUERY
  SELECT 'anon_allowlist_read_only'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Allowlisted anon objects must expose SELECT only.'
  FROM (
    SELECT count(*) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE r.rolname = 'anon'
      AND cl.relname IN ('public_jobs','public_shifts','specialties')
      AND a.privilege_type <> 'SELECT'
  ) s;

  RETURN QUERY
  SELECT 'anon_function_allowlist'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Anon EXECUTE outside documented public read endpoints (search_public_jobs, search_public_shifts, public_listing_places).'
  FROM (
    SELECT count(*) c
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    LEFT JOIN pg_roles r ON r.oid = a.grantee
    WHERE a.privilege_type = 'EXECUTE'
      AND (a.grantee = 0 OR r.rolname = 'anon')
      AND p.proname NOT IN ('search_public_jobs','search_public_shifts','public_listing_places')
  ) s;

  RETURN QUERY
  SELECT 'client_executable_trigger_functions'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Trigger functions in public executable by PUBLIC/anon/authenticated (expected 0; triggers fire internally).'
  FROM (
    SELECT count(*) c
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    LEFT JOIN pg_roles r ON r.oid = a.grantee
    WHERE p.prorettype = 'trigger'::regtype
      AND a.privilege_type = 'EXECUTE'
      AND (a.grantee = 0 OR r.rolname IN ('anon','authenticated'))
  ) s;

  RETURN QUERY
  SELECT 'public_security_definer_functions'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'SECURITY DEFINER functions executable by PUBLIC/anon (expected 0; public contact runs through the server function).'
  FROM (
    SELECT count(*) c
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    LEFT JOIN pg_roles r ON r.oid = a.grantee
    WHERE p.prosecdef AND a.privilege_type = 'EXECUTE'
      AND (a.grantee = 0 OR r.rolname = 'anon')
  ) s;

  RETURN QUERY
  SELECT 'client_tables_without_rls'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Public tables reachable by anon/authenticated without row level security enabled.'
  FROM (
    SELECT count(DISTINCT cl.oid) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE cl.relkind = 'r' AND NOT cl.relrowsecurity AND r.rolname IN ('anon','authenticated')
  ) s;

  RETURN QUERY
  SELECT 'client_sequence_privileges'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'Sequences exposed to client roles.'
  FROM (
    SELECT count(*) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE cl.relkind = 'S' AND r.rolname IN ('anon','authenticated')
  ) s;
END;
$function$;

REVOKE ALL ON FUNCTION public.release_privilege_audit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_privilege_audit() TO authenticated, service_role;