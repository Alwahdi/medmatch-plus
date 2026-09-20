-- Phase 103: verification evidence must be approved AND unexpired.
-- Validity rule (single rule everywhere): a document is valid while
-- expiry_date IS NULL OR expiry_date >= current_date (valid through that day).

CREATE OR REPLACE FUNCTION private.pro_verification_evidence_ok(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(DISTINCT c.doc_type) >= 2
  FROM public.credentials c
  WHERE c.user_id = _user_id
    AND c.status = 'approved'
    AND (c.expiry_date IS NULL OR c.expiry_date >= current_date)
    AND c.doc_type IN ('ترخيص مزاولة المهنة', 'بطاقة الهوية / الجواز');
$$;

CREATE OR REPLACE FUNCTION private.facility_verification_evidence_ok(_facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(DISTINCT d.doc_type) >= 2
  FROM public.facility_documents d
  WHERE d.facility_id = _facility_id
    AND d.status = 'approved'
    AND (d.expiry_date IS NULL OR d.expiry_date >= current_date)
    AND d.doc_type IN ('رخصة مزاولة المنشأة', 'السجل التجاري');
$$;

-- Facility document trigger previously fired only on status changes; expiry
-- and doc_type edits must recompute the badge immediately too.
DROP TRIGGER IF EXISTS trg_sync_facility_verification ON public.facility_documents;
CREATE TRIGGER trg_sync_facility_verification
AFTER INSERT OR DELETE OR UPDATE ON public.facility_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_facility_verification();

-- Time-based refresh: nothing changes a row by the mere passage of time, so a
-- daily maintenance pass recomputes denormalized is_verified flags.
CREATE OR REPLACE FUNCTION public.refresh_verification_expiry()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _pros int := 0;
  _facs int := 0;
BEGIN
  WITH upd AS (
    UPDATE public.healthcare_professionals h
       SET is_verified = private.pro_verification_evidence_ok(h.user_id)
                         AND h.verification_suspended_at IS NULL
     WHERE h.is_verified IS DISTINCT FROM (
             private.pro_verification_evidence_ok(h.user_id)
             AND h.verification_suspended_at IS NULL)
    RETURNING 1)
  SELECT count(*) INTO _pros FROM upd;

  WITH upd AS (
    UPDATE public.facilities f
       SET is_verified = private.facility_verification_evidence_ok(f.id)
                         AND f.verification_suspended_at IS NULL
     WHERE f.is_verified IS DISTINCT FROM (
             private.facility_verification_evidence_ok(f.id)
             AND f.verification_suspended_at IS NULL)
    RETURNING 1)
  SELECT count(*) INTO _facs FROM upd;

  RETURN jsonb_build_object(
    'professionals_updated', _pros,
    'facilities_updated', _facs,
    'ran_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_verification_expiry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_verification_expiry() TO service_role;

-- Bring current data in line with the new rule.
SELECT public.refresh_verification_expiry();
