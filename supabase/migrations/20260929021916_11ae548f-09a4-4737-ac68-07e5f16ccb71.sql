CREATE TABLE public.document_upload_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE,
 target text NOT NULL CHECK (target IN ('professional','facility')), doc_type text NOT NULL,
 reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 5 AND 500),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 admin_note text, reviewed_by uuid, reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT document_upload_request_owner_ck CHECK ((target = 'professional' AND facility_id IS NULL) OR (target = 'facility' AND facility_id IS NOT NULL))
);
GRANT SELECT, INSERT ON public.document_upload_requests TO authenticated;
GRANT ALL ON public.document_upload_requests TO service_role;
ALTER TABLE public.document_upload_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins read upload requests" ON public.document_upload_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners request document renewal" ON public.document_upload_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND admin_note IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL AND ((target = 'professional' AND facility_id IS NULL AND EXISTS (SELECT 1 FROM public.healthcare_professionals p WHERE p.user_id = auth.uid())) OR (target = 'facility' AND EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()))) AND EXISTS (SELECT 1 FROM public.document_requirements r WHERE r.target = document_upload_requests.target AND r.code = doc_type AND r.is_active));
CREATE UNIQUE INDEX document_upload_requests_pending_unique ON public.document_upload_requests(user_id,target,doc_type) WHERE status = 'pending';
CREATE INDEX document_upload_requests_review_idx ON public.document_upload_requests(status,created_at);
CREATE TRIGGER document_upload_requests_updated_at BEFORE UPDATE ON public.document_upload_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.document_renewal_policy (
 id boolean PRIMARY KEY DEFAULT true CHECK (id), renewal_days integer NOT NULL DEFAULT 60 CHECK (renewal_days BETWEEN 0 AND 365),
 updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
GRANT SELECT ON public.document_renewal_policy TO authenticated;
GRANT ALL ON public.document_renewal_policy TO service_role;
ALTER TABLE public.document_renewal_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in users read renewal window" ON public.document_renewal_policy FOR SELECT TO authenticated USING (true);
INSERT INTO public.document_renewal_policy(id,renewal_days) VALUES (true,60);
CREATE OR REPLACE FUNCTION public.admin_set_document_renewal_days(_days integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
 PERFORM public.require_mfa();
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF _days IS NULL OR _days < 0 OR _days > 365 THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
 UPDATE public.document_renewal_policy SET renewal_days = _days, updated_at = now(), updated_by = auth.uid() WHERE id = true;
END; $fn$;
REVOKE ALL ON FUNCTION public.admin_set_document_renewal_days(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_document_renewal_days(integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_review_document_upload_request(_id uuid,_approve boolean,_note text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r public.document_upload_requests%ROWTYPE;
BEGIN
 PERFORM public.require_mfa();
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF char_length(coalesce(_note,'')) > 500 THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
 SELECT * INTO r FROM public.document_upload_requests WHERE id = _id FOR UPDATE;
 IF r.id IS NULL OR r.status <> 'pending' THEN RAISE EXCEPTION 'NOT_FOUND_OR_REVIEWED'; END IF;
 UPDATE public.document_upload_requests SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, admin_note = nullif(btrim(_note),''), reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _id;
 PERFORM public.push_notification(r.user_id,'document_upload_request',CASE WHEN _approve THEN 'يمكنك الآن رفع الوثيقة البديلة' ELSE 'تم رفض طلب رفع الوثيقة' END,CASE WHEN _approve THEN 'Document replacement approved' ELSE 'Document replacement request declined' END,coalesce(_note,r.doc_type),coalesce(_note,r.doc_type),'/verification');
END; $fn$;
REVOKE ALL ON FUNCTION public.admin_review_document_upload_request(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_document_upload_request(uuid,boolean,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_document_renewal() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_target text; v_owner uuid; v_prior timestamptz; v_days integer;
BEGIN
 IF TG_TABLE_NAME = 'credentials' THEN v_target := 'professional'; v_owner := NEW.user_id;
 ELSE v_target := 'facility'; SELECT user_id INTO v_owner FROM public.facilities WHERE id = NEW.facility_id; END IF;
 IF auth.uid() IS NULL OR v_owner IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 SELECT renewal_days INTO v_days FROM public.document_renewal_policy WHERE id = true;
 v_days := coalesce(v_days,60);
 IF TG_TABLE_NAME = 'credentials' THEN
   SELECT max(created_at) INTO v_prior FROM public.credentials WHERE user_id = NEW.user_id AND doc_type = NEW.doc_type AND status = 'approved' AND (expiry_date IS NULL OR expiry_date > current_date + v_days);
 ELSE
   SELECT max(created_at) INTO v_prior FROM public.facility_documents WHERE facility_id = NEW.facility_id AND doc_type = NEW.doc_type AND status = 'approved' AND (expiry_date IS NULL OR expiry_date > current_date + v_days);
 END IF;
 IF v_prior IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.document_upload_requests r WHERE r.user_id = v_owner AND r.target = v_target AND r.doc_type = NEW.doc_type AND r.status = 'approved' AND r.reviewed_at > v_prior
 ) THEN RAISE EXCEPTION 'DOCUMENT_RENEWAL_LOCKED'; END IF;
 RETURN NEW;
END; $fn$;
REVOKE ALL ON FUNCTION public.guard_document_renewal() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_credential_renewal BEFORE INSERT ON public.credentials FOR EACH ROW EXECUTE FUNCTION public.guard_document_renewal();
CREATE TRIGGER guard_facility_document_renewal BEFORE INSERT ON public.facility_documents FOR EACH ROW EXECUTE FUNCTION public.guard_document_renewal();