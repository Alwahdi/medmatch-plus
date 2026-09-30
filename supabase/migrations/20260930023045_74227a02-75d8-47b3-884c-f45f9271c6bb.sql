-- Keep the reviewed deletion request and its audit record after the login is removed.
ALTER TABLE public.account_deletion_requests DROP CONSTRAINT IF EXISTS account_deletion_requests_user_id_fkey;

CREATE TABLE public.account_deletion_audit_log (
  request_id uuid PRIMARY KEY REFERENCES public.account_deletion_requests(id),
  removed_files integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.account_deletion_audit_log TO service_role;
ALTER TABLE public.account_deletion_audit_log ENABLE ROW LEVEL SECURITY;
-- No client policy: only the service role may access the audit log.
CREATE TRIGGER account_deletion_audit_updated_at BEFORE UPDATE ON public.account_deletion_audit_log FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.service_role_collect_deletion_artifacts(_request_id uuid)
RETURNS TABLE(user_id uuid, bucket_id text, object_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE _uid uuid;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  SELECT r.user_id INTO _uid FROM public.account_deletion_requests r
    WHERE r.id = _request_id AND r.status = 'processing';
  IF _uid IS NULL THEN RAISE EXCEPTION 'REQUEST_NOT_PROCESSING'; END IF;
  RETURN QUERY
    SELECT _uid, o.bucket_id::text, o.name::text FROM storage.objects o WHERE o.owner_id = _uid::text
    UNION
    SELECT _uid, 'credentials'::text, c.file_path FROM public.credentials c WHERE c.user_id = _uid AND c.file_path IS NOT NULL
    UNION
    SELECT _uid, 'facility-docs'::text, d.file_path FROM public.facility_documents d
      JOIN public.facilities f ON f.id = d.facility_id WHERE f.user_id = _uid AND d.file_path IS NOT NULL
    UNION
    SELECT _uid, 'chat-attachments'::text, m.attachment_path FROM public.messages m
      WHERE m.sender_id = _uid AND m.attachment_path IS NOT NULL
    UNION
    SELECT _uid, 'credentials'::text, p.attachment_path FROM public.profile_change_requests p
      WHERE p.user_id = _uid AND p.attachment_path IS NOT NULL
    UNION
    SELECT _uid, NULL::text, NULL::text;
END;
$fn$;
REVOKE ALL ON FUNCTION public.service_role_collect_deletion_artifacts(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_role_collect_deletion_artifacts(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.service_role_finalize_account_deletion(_request_id uuid, _removed_files integer DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE _uid uuid;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _removed_files < 0 THEN RAISE EXCEPTION 'INVALID_FILE_COUNT'; END IF;
  SELECT r.user_id INTO _uid FROM public.account_deletion_requests r
    WHERE r.id = _request_id AND r.status = 'processing' FOR UPDATE;
  IF _uid IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.account_deletion_requests WHERE id = _request_id AND status = 'completed') THEN RETURN; END IF;
    RAISE EXCEPTION 'REQUEST_NOT_PROCESSING';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _uid) THEN RAISE EXCEPTION 'AUTH_USER_NOT_DELETED'; END IF;

  -- Preserve counterparties' applications, bookings, messages and reviews; scrub identifying profile data.
  UPDATE public.profiles SET full_name = 'Deleted user', phone = NULL, country = NULL, city = NULL,
    avatar_url = NULL WHERE id = _uid;
  UPDATE public.healthcare_professionals SET full_name = 'Deleted user', headline = NULL, bio = NULL,
    license_number = NULL, license_country = NULL, country = NULL, city = NULL,
    avatar_url = NULL, is_verified = false, is_searchable = false, is_open_to_shifts = false,
    lat = NULL, lng = NULL, expected_salary = NULL WHERE user_id = _uid;
  UPDATE public.jobs SET is_active = false WHERE facility_id IN (SELECT id FROM public.facilities WHERE user_id = _uid);
  UPDATE public.shifts SET status = 'cancelled' WHERE status = 'open' AND booked_by IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.shift_id = shifts.id AND b.status = 'confirmed')
    AND facility_id IN (SELECT id FROM public.facilities WHERE user_id = _uid);
  UPDATE public.invitations SET status = 'cancelled' WHERE status = 'pending' AND
    (professional_user_id = _uid OR facility_id IN (SELECT id FROM public.facilities WHERE user_id = _uid));
  UPDATE public.facilities SET name_ar = 'منشأة محذوفة', name_en = 'Deleted facility',
    description = NULL, logo_url = NULL, website = NULL, is_verified = false, lat = NULL, lng = NULL
    WHERE user_id = _uid;
  UPDATE public.messages SET attachment_path = NULL, attachment_name = NULL,
    attachment_type = NULL, attachment_size = NULL WHERE sender_id = _uid;
  DELETE FROM public.credentials WHERE user_id = _uid;
  DELETE FROM public.facility_documents WHERE facility_id IN (SELECT id FROM public.facilities WHERE user_id = _uid);
  DELETE FROM public.profile_change_requests WHERE user_id = _uid;
  DELETE FROM public.document_upload_requests WHERE user_id = _uid;
  DELETE FROM public.notifications WHERE user_id = _uid;
  DELETE FROM public.job_alerts WHERE user_id = _uid;
  DELETE FROM public.push_subscriptions WHERE user_id = _uid;
  DELETE FROM public.saved_jobs WHERE user_id = _uid;
  DELETE FROM public.candidate_search_access WHERE professional_user_id = _uid;
  DELETE FROM public.trusted_devices WHERE user_id = _uid;
  DELETE FROM public.user_roles WHERE user_id = _uid;
  UPDATE public.account_deletion_requests SET status = 'completed', email_snapshot = '[deleted]',
    reason = NULL, admin_note = NULL, processed_at = now() WHERE id = _request_id;
  INSERT INTO public.account_deletion_audit_log (request_id, removed_files)
    VALUES (_request_id, _removed_files) ON CONFLICT (request_id) DO NOTHING;
END;
$fn$;
REVOKE ALL ON FUNCTION public.service_role_finalize_account_deletion(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_role_finalize_account_deletion(uuid, integer) TO service_role;