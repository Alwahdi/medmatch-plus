CREATE TABLE public.facility_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  title text NOT NULL,
  issuer text,
  issue_date date,
  expiry_date date,
  file_path text,
  status public.credential_status NOT NULL DEFAULT 'pending',
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.facility_documents TO authenticated;
GRANT ALL ON public.facility_documents TO service_role;

ALTER TABLE public.facility_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facility owners read own documents"
ON public.facility_documents FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Facility owners insert own documents"
ON public.facility_documents FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())
);

CREATE POLICY "Facility owners update own documents"
ON public.facility_documents FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Facility owners delete own documents"
ON public.facility_documents FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())
);

CREATE INDEX idx_facility_documents_facility ON public.facility_documents(facility_id);
CREATE INDEX idx_facility_documents_status ON public.facility_documents(status);

CREATE TRIGGER update_facility_documents_updated_at
BEFORE UPDATE ON public.facility_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_facility_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_core int;
BEGIN
  SELECT count(DISTINCT doc_type) INTO approved_core
  FROM public.facility_documents
  WHERE facility_id = NEW.facility_id
    AND status = 'approved'
    AND doc_type IN ('رخصة مزاولة المنشأة', 'السجل التجاري');

  UPDATE public.facilities
  SET is_verified = (approved_core >= 2)
  WHERE id = NEW.facility_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_facility_verification() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_sync_facility_verification
AFTER INSERT OR UPDATE OF status ON public.facility_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_facility_verification();

CREATE OR REPLACE FUNCTION public.notify_facility_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    SELECT user_id INTO owner_id FROM public.facilities WHERE id = NEW.facility_id;
    IF owner_id IS NOT NULL THEN
      PERFORM public.push_notification(
        owner_id,
        'facility_document',
        CASE WHEN NEW.status = 'approved' THEN 'تم اعتماد مستند المنشأة' ELSE 'تم رفض مستند المنشأة' END,
        CASE WHEN NEW.status = 'approved' THEN 'Facility document approved' ELSE 'Facility document rejected' END,
        NEW.title,
        NEW.title,
        '/facility/verification'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_facility_document() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_notify_facility_document
AFTER UPDATE ON public.facility_documents
FOR EACH ROW EXECUTE FUNCTION public.notify_facility_document();