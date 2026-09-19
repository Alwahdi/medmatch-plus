-- 1) Column-level privileges: system-managed fields are no longer writable by owners

REVOKE INSERT, UPDATE ON public.healthcare_professionals FROM authenticated;
GRANT INSERT (user_id, full_name, headline, specialty_id, years_experience, country, city, bio,
              license_country, license_number, is_open_to_shifts, expected_salary, currency,
              avatar_url, is_searchable),
      UPDATE (user_id, full_name, headline, specialty_id, years_experience, country, city, bio,
              license_country, license_number, is_open_to_shifts, expected_salary, currency,
              avatar_url, is_searchable)
  ON public.healthcare_professionals TO authenticated;
GRANT ALL ON public.healthcare_professionals TO service_role;

REVOKE INSERT, UPDATE ON public.facilities FROM authenticated;
GRANT INSERT (user_id, name_ar, name_en, facility_type, country, city, description, logo_url, website),
      UPDATE (user_id, name_ar, name_en, facility_type, country, city, description, logo_url, website)
  ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;

-- ownership can never be reassigned through an UPDATE (upserts still send user_id)
CREATE OR REPLACE FUNCTION public.guard_profile_ownership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'ownership is system managed';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_pro_ownership ON public.healthcare_professionals;
CREATE TRIGGER guard_pro_ownership BEFORE UPDATE ON public.healthcare_professionals
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_ownership();

DROP TRIGGER IF EXISTS guard_facility_ownership ON public.facilities;
CREATE TRIGGER guard_facility_ownership BEFORE UPDATE ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_ownership();

-- 2) Credentials / facility documents: no direct UPDATE from clients at all
DROP POLICY IF EXISTS "cred own update" ON public.credentials;
REVOKE UPDATE ON public.credentials FROM authenticated;
GRANT ALL ON public.credentials TO service_role;

DROP POLICY IF EXISTS "Facility owners update own documents" ON public.facility_documents;
REVOKE UPDATE ON public.facility_documents FROM authenticated;
GRANT ALL ON public.facility_documents TO service_role;

-- 3) Facility subscriptions: read-only from the client
DROP POLICY IF EXISTS "sub owner insert" ON public.facility_subscriptions;
DROP POLICY IF EXISTS "sub owner update" ON public.facility_subscriptions;
REVOKE INSERT, UPDATE, DELETE ON public.facility_subscriptions FROM authenticated;
GRANT SELECT ON public.facility_subscriptions TO authenticated;
GRANT ALL ON public.facility_subscriptions TO service_role;

-- 4) Admin-only RPCs for the review actions the admin panel performs
CREATE OR REPLACE FUNCTION public.admin_review_credential(
  _id uuid, _status credential_status, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.credentials
     SET status = _status, review_note = NULLIF(btrim(coalesce(_note, '')), '')
   WHERE id = _id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not found';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_review_facility_document(
  _id uuid, _status credential_status, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.facility_documents
     SET status = _status, review_note = NULLIF(btrim(coalesce(_note, '')), '')
   WHERE id = _id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not found';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_facility_verified(_facility_id uuid, _value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.facilities SET is_verified = _value WHERE id = _facility_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not found';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_professional_verified(_professional_id uuid, _value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.healthcare_professionals SET is_verified = _value WHERE id = _professional_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not found';
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.admin_review_credential(uuid, credential_status, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_review_facility_document(uuid, credential_status, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_facility_verified(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_professional_verified(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_credential(uuid, credential_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_facility_document(uuid, credential_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_facility_verified(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_professional_verified(uuid, boolean) TO authenticated;

-- 5) Facility verification invariant also recomputes on document deletion
CREATE OR REPLACE FUNCTION public.sync_facility_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _facility_id uuid;
  approved_core int;
BEGIN
  _facility_id := COALESCE(NEW.facility_id, OLD.facility_id);

  SELECT count(DISTINCT doc_type) INTO approved_core
  FROM public.facility_documents
  WHERE facility_id = _facility_id
    AND status = 'approved'
    AND doc_type IN ('رخصة مزاولة المنشأة', 'السجل التجاري');

  UPDATE public.facilities
  SET is_verified = (approved_core >= 2)
  WHERE id = _facility_id;

  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_facility_verification ON public.facility_documents;
CREATE TRIGGER trg_sync_facility_verification
AFTER INSERT OR DELETE OR UPDATE OF status ON public.facility_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_facility_verification();