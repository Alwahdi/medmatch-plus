-- Phase 69: drop the obsolete contact RPC; keep only the hardened internal one.
DROP FUNCTION IF EXISTS public.submit_contact_message(text, text, text, text);

REVOKE ALL ON FUNCTION public.submit_contact_message_internal(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact_message_internal(text, text, text, text) TO service_role;

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
  SELECT 'server_managed_table_writes'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'blocker' END, c::int,
         'Direct write privileges on server-managed tables that must only change through trusted RPCs.'
  FROM (
    SELECT count(*) c
    FROM pg_class cl JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    CROSS JOIN LATERAL aclexplode(cl.relacl) a JOIN pg_roles r ON r.oid = a.grantee
    WHERE r.rolname IN ('anon','authenticated')
      AND a.privilege_type IN ('INSERT','UPDATE','DELETE')
      AND cl.relname IN (
        'account_deletion_requests','ai_usage_events','alert_deliveries','applications',
        'candidate_search_access','candidate_search_requests','contact_messages','conversations',
        'facility_subscriptions','interviews','invitations','notifications','profile_change_log',
        'reviews','safety_reports','shift_bookings','specialties','subscription_plans','user_roles'
      )
  ) s;

  RETURN QUERY
  SELECT 'public_security_definer_functions'::text,
         CASE WHEN c = 0 THEN 'ok' ELSE 'warning' END, c::int,
         'SECURITY DEFINER functions executable by PUBLIC/anon (none are intended; public contact runs through the server function).'
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