-- Phase 82 (requested as Phase77): evidence-backed verification badge.

ALTER TABLE public.healthcare_professionals
  ADD COLUMN IF NOT EXISTS verification_suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_suspension_reason text;
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS verification_suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_suspension_reason text;

ALTER TABLE public.healthcare_professionals DROP CONSTRAINT IF EXISTS hp_verification_suspension_ck;
ALTER TABLE public.healthcare_professionals ADD CONSTRAINT hp_verification_suspension_ck CHECK (
  (verification_suspended_at IS NULL AND verification_suspension_reason IS NULL)
  OR (verification_suspended_at IS NOT NULL AND char_length(btrim(verification_suspension_reason)) BETWEEN 3 AND 500)
);
ALTER TABLE public.facilities DROP CONSTRAINT IF EXISTS fac_verification_suspension_ck;
ALTER TABLE public.facilities ADD CONSTRAINT fac_verification_suspension_ck CHECK (
  (verification_suspended_at IS NULL AND verification_suspension_reason IS NULL)
  OR (verification_suspended_at IS NOT NULL AND char_length(btrim(verification_suspension_reason)) BETWEEN 3 AND 500)
);

-- Evidence helpers (trusted, service_role only).
CREATE OR REPLACE FUNCTION private.pro_verification_evidence_ok(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(DISTINCT c.doc_type) >= 2
  FROM public.credentials c
  WHERE c.user_id = _user_id
    AND c.status = 'approved'
    AND c.doc_type IN ('ترخيص مزاولة المهنة', 'بطاقة الهوية / الجواز');
$$;

CREATE OR REPLACE FUNCTION private.facility_verification_evidence_ok(_facility_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(DISTINCT d.doc_type) >= 2
  FROM public.facility_documents d
  WHERE d.facility_id = _facility_id
    AND d.status = 'approved'
    AND d.doc_type IN ('رخصة مزاولة المنشأة', 'السجل التجاري');
$$;

-- Sync triggers: evidence AND not administratively suspended.
CREATE OR REPLACE FUNCTION public.sync_pro_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  _uid := COALESCE(NEW.user_id, OLD.user_id);
  UPDATE public.healthcare_professionals h
     SET is_verified = private.pro_verification_evidence_ok(_uid)
                       AND h.verification_suspended_at IS NULL
   WHERE h.user_id = _uid;
  RETURN NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.sync_facility_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _fid uuid;
BEGIN
  _fid := COALESCE(NEW.facility_id, OLD.facility_id);
  UPDATE public.facilities f
     SET is_verified = private.facility_verification_evidence_ok(_fid)
                       AND f.verification_suspended_at IS NULL
   WHERE f.id = _fid;
  RETURN NULL;
END; $$;

-- Admin controls: no manual positive override.
DROP FUNCTION IF EXISTS public.admin_set_professional_verified(uuid, boolean);
CREATE OR REPLACE FUNCTION public.admin_set_professional_verified(
  _professional_id uuid, _value boolean, _reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT user_id INTO _uid FROM public.healthcare_professionals WHERE id = _professional_id;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not found';
  END IF;

  IF _value THEN
    IF NOT private.pro_verification_evidence_ok(_uid) THEN
      RAISE EXCEPTION 'VERIFICATION_REQUIREMENTS_NOT_MET';
    END IF;
    UPDATE public.healthcare_professionals
       SET verification_suspended_at = NULL,
           verification_suspension_reason = NULL,
           is_verified = true
     WHERE id = _professional_id;
  ELSE
    IF btrim(coalesce(_reason, '')) = '' THEN
      RAISE EXCEPTION 'VERIFICATION_SUSPENSION_REASON_REQUIRED';
    END IF;
    UPDATE public.healthcare_professionals
       SET verification_suspended_at = now(),
           verification_suspension_reason = btrim(_reason),
           is_verified = false
     WHERE id = _professional_id;
  END IF;
END; $$;

DROP FUNCTION IF EXISTS public.admin_set_facility_verified(uuid, boolean);
CREATE OR REPLACE FUNCTION public.admin_set_facility_verified(
  _facility_id uuid, _value boolean, _reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.facilities WHERE id = _facility_id) THEN
    RAISE EXCEPTION 'not found';
  END IF;

  IF _value THEN
    IF NOT private.facility_verification_evidence_ok(_facility_id) THEN
      RAISE EXCEPTION 'VERIFICATION_REQUIREMENTS_NOT_MET';
    END IF;
    UPDATE public.facilities
       SET verification_suspended_at = NULL,
           verification_suspension_reason = NULL,
           is_verified = true
     WHERE id = _facility_id;
  ELSE
    IF btrim(coalesce(_reason, '')) = '' THEN
      RAISE EXCEPTION 'VERIFICATION_SUSPENSION_REASON_REQUIRED';
    END IF;
    UPDATE public.facilities
       SET verification_suspended_at = now(),
           verification_suspension_reason = btrim(_reason),
           is_verified = false
     WHERE id = _facility_id;
  END IF;
END; $$;

-- Phase 60 explicit least-privilege grants.
REVOKE ALL ON FUNCTION private.pro_verification_evidence_ok(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.facility_verification_evidence_ok(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.pro_verification_evidence_ok(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.facility_verification_evidence_ok(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.admin_set_professional_verified(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_facility_verified(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_professional_verified(uuid, boolean, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_facility_verified(uuid, boolean, text) TO authenticated, service_role;

REVOKE ALL ON TABLE public.healthcare_professionals FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.facilities FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.healthcare_professionals TO service_role;
GRANT ALL ON TABLE public.facilities TO service_role;