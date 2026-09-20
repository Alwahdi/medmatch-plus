-- Phase 100: admin MFA is mandatory, not optional-if-enrolled.

CREATE OR REPLACE FUNCTION public.admin_mfa_access_ok()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM auth.mfa_factors f
      WHERE f.user_id = (SELECT auth.uid())
        AND f.status = 'verified'
        AND f.factor_type = 'totp'
    )
    AND COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

CREATE OR REPLACE FUNCTION public.require_admin_mfa()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM public.user_roles ur
       WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'
     ) THEN
    RAISE EXCEPTION 'NOT_ADMIN';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM auth.mfa_factors f
    WHERE f.user_id = (SELECT auth.uid())
      AND f.status = 'verified'
      AND f.factor_type = 'totp'
  ) THEN
    RAISE EXCEPTION 'ADMIN_MFA_ENROLLMENT_REQUIRED';
  END IF;
  IF COALESCE(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'MFA_REQUIRED';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mfa_access_ok() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.require_admin_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mfa_access_ok() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.require_admin_mfa() TO authenticated, service_role;

-- 1) Swap the generic MFA guard for the admin-mandatory guard in every admin RPC.
DO $do$
DECLARE r record; _def text; _new text;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN (
        'admin_chat_attachment_orphans','admin_data_integrity_report',
        'admin_list_account_deletion_requests','admin_list_safety_reports',
        'admin_review_credential','admin_review_facility_document',
        'admin_set_admin_role','admin_set_facility_verified','admin_set_professional_verified',
        'admin_update_account_deletion','admin_update_safety_report',
        'release_privilege_audit','release_readiness_report','review_change_request'
      )
  LOOP
    _def := pg_get_functiondef(r.oid);
    IF position('PERFORM public.require_mfa();' in _def) = 0 THEN
      RAISE EXCEPTION 'Phase100: guard anchor missing in %', r.proname;
    END IF;
    _new := replace(_def, 'PERFORM public.require_mfa();', 'PERFORM public.require_admin_mfa();');
    EXECUTE _new;
  END LOOP;
END
$do$;

-- 2) Release readiness: an admin without a verified TOTP factor is a launch blocker.
DO $do$
DECLARE _def text; _anchor text; _block text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO _def
  FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='release_readiness_report';

  IF position('admin_without_mfa' in _def) > 0 THEN
    RETURN;
  END IF;

  _anchor := E'  RETURN QUERY\n  SELECT ''orphan_roles''::text';
  IF position(_anchor in _def) = 0 THEN
    RAISE EXCEPTION 'Phase100: readiness anchor missing';
  END IF;

  _block := E'  RETURN QUERY\n'
         || E'  SELECT ''admin_without_mfa''::text,\n'
         || E'         CASE WHEN c = 0 THEN ''ok'' ELSE ''blocker'' END,\n'
         || E'         c::int,\n'
         || E'         ''Live admin accounts without a verified TOTP factor. Admin capabilities require enrolled two-factor authentication.''\n'
         || E'  FROM (\n'
         || E'    SELECT count(*) c FROM public.user_roles ur\n'
         || E'    JOIN auth.users u ON u.id = ur.user_id\n'
         || E'    WHERE ur.role = ''admin''\n'
         || E'      AND NOT EXISTS (\n'
         || E'        SELECT 1 FROM auth.mfa_factors f\n'
         || E'        WHERE f.user_id = ur.user_id AND f.status = ''verified'' AND f.factor_type = ''totp''\n'
         || E'      )\n'
         || E'  ) s;\n\n'
         || _anchor;

  EXECUTE replace(_def, _anchor, _block);
END
$do$;

-- 3) RLS: every admin branch now demands admin MFA.
DROP POLICY IF EXISTS "admins read deletion requests" ON public.account_deletion_requests;
CREATE POLICY "admins read deletion requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated USING (public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "admins read contact messages" ON public.contact_messages;
CREATE POLICY "admins read contact messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "admins update contact messages" ON public.contact_messages;
CREATE POLICY "admins update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (public.admin_mfa_access_ok()) WITH CHECK (public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "admins read safety reports" ON public.safety_reports;
CREATE POLICY "admins read safety reports" ON public.safety_reports
  FOR SELECT TO authenticated USING (public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "Admins review change requests" ON public.profile_change_requests;
CREATE POLICY "Admins review change requests" ON public.profile_change_requests
  FOR UPDATE TO authenticated USING (public.admin_mfa_access_ok()) WITH CHECK (public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "Owners read own change requests" ON public.profile_change_requests;
CREATE POLICY "Owners read own change requests" ON public.profile_change_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "Owner or admin reads change log" ON public.profile_change_log;
CREATE POLICY "Owner or admin reads change log" ON public.profile_change_log
  FOR SELECT TO authenticated USING (subject_user_id = auth.uid() OR public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "cred own read" ON public.credentials;
CREATE POLICY "cred own read" ON public.credentials
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "Facility owners read own documents" ON public.facility_documents;
CREATE POLICY "Facility owners read own documents" ON public.facility_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_documents.facility_id AND f.user_id = auth.uid())
    OR public.admin_mfa_access_ok()
  );

DROP POLICY IF EXISTS "facility owner read" ON public.facilities;
CREATE POLICY "facility owner read" ON public.facilities
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "facility owner update" ON public.facilities;
CREATE POLICY "facility owner update" ON public.facilities
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.admin_mfa_access_ok())
  WITH CHECK (auth.uid() = user_id OR public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "pro own update" ON public.healthcare_professionals;
CREATE POLICY "pro own update" ON public.healthcare_professionals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.admin_mfa_access_ok())
  WITH CHECK (auth.uid() = user_id OR public.admin_mfa_access_ok());

DROP POLICY IF EXISTS "sub owner read" ON public.facility_subscriptions;
CREATE POLICY "sub owner read" ON public.facility_subscriptions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = facility_subscriptions.facility_id
        AND (f.user_id = auth.uid() OR public.admin_mfa_access_ok())
    )
  );

-- 4) Storage: admin document review requires admin MFA too.
DROP POLICY IF EXISTS "Facility owners read facility docs" ON storage.objects;
CREATE POLICY "Facility owners read facility docs" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'facility-docs'
    AND (
      public.admin_mfa_access_ok()
      OR EXISTS (
        SELECT 1 FROM public.facilities f
        WHERE f.user_id = auth.uid() AND f.id::text = (storage.foldername(objects.name))[1]
      )
    )
  );

DROP POLICY IF EXISTS "credentials own read" ON storage.objects;
CREATE POLICY "credentials own read" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'credentials'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.admin_mfa_access_ok()
    )
  );