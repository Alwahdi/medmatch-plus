CREATE TABLE IF NOT EXISTS public.legal_documents (
  key text PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  body_ar text,
  body_en text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_documents TO anon;
GRANT SELECT ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legal_documents_public_read" ON public.legal_documents;
CREATE POLICY "legal_documents_public_read"
  ON public.legal_documents FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doc_key text NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, doc_key, version)
);

CREATE INDEX IF NOT EXISTS user_consents_user_idx ON public.user_consents (user_id, doc_key);

GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_consents_select_own" ON public.user_consents;
CREATE POLICY "user_consents_select_own"
  ON public.user_consents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_consents_insert_own" ON public.user_consents;
CREATE POLICY "user_consents_insert_own"
  ON public.user_consents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- الموافقة تُسجَّل دائماً بالإصدار الحالي المنشور، مهما أرسل العميل
CREATE OR REPLACE FUNCTION public.normalize_user_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _v integer;
BEGIN
  SELECT version INTO _v FROM public.legal_documents WHERE key = NEW.doc_key;
  IF _v IS NULL THEN RAISE EXCEPTION 'UNKNOWN_LEGAL_DOCUMENT'; END IF;
  NEW.user_id := auth.uid();
  NEW.version := _v;
  NEW.created_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_consents_normalize ON public.user_consents;
CREATE TRIGGER user_consents_normalize
  BEFORE INSERT ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.normalize_user_consent();

CREATE OR REPLACE FUNCTION public.touch_legal_documents_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS legal_documents_touch ON public.legal_documents;
CREATE TRIGGER legal_documents_touch
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_legal_documents_updated_at();

INSERT INTO public.legal_documents (key, title_ar, title_en) VALUES
  ('privacy', 'سياسة الخصوصية', 'Privacy Policy'),
  ('terms', 'الشروط والأحكام', 'Terms and Conditions'),
  ('applicant_commitments', 'التزامات المتقدم', 'Applicant commitments'),
  ('publisher_commitments', 'التزامات الناشر', 'Publisher commitments'),
  ('contact_info', 'بيانات التواصل', 'Contact details')
ON CONFLICT (key) DO NOTHING;

-- ── فرض الموافقة قبل التقديم أو النشر ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.require_consent(_doc_key text, _error text)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _v integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  SELECT version INTO _v FROM public.legal_documents WHERE key = _doc_key;
  IF _v IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_consents c
    WHERE c.user_id = auth.uid() AND c.doc_key = _doc_key AND c.version >= _v
  ) THEN
    RAISE EXCEPTION '%', _error;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.guard_applicant_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_consent('applicant_commitments', 'CONSENT_REQUIRED_APPLICANT');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_publisher_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_consent('publisher_commitments', 'CONSENT_REQUIRED_PUBLISHER');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS applications_require_consent ON public.applications;
CREATE TRIGGER applications_require_consent
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_applicant_consent();

DROP TRIGGER IF EXISTS shift_bookings_require_consent ON public.shift_bookings;
CREATE TRIGGER shift_bookings_require_consent
  BEFORE INSERT ON public.shift_bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_applicant_consent();

DROP TRIGGER IF EXISTS jobs_require_consent ON public.jobs;
CREATE TRIGGER jobs_require_consent
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.guard_publisher_consent();

DROP TRIGGER IF EXISTS shifts_require_consent ON public.shifts;
CREATE TRIGGER shifts_require_consent
  BEFORE INSERT ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.guard_publisher_consent();

-- ── تحرير المحتوى من لوحة المدير ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_upsert_legal_document(
  _key text,
  _title_ar text,
  _title_en text,
  _body_ar text,
  _body_en text,
  _meta jsonb,
  _bump_version boolean
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _v integer;
BEGIN
  PERFORM public.require_admin_mfa();
  IF _key NOT IN ('privacy','terms','applicant_commitments','publisher_commitments','contact_info') THEN
    RAISE EXCEPTION 'UNKNOWN_LEGAL_DOCUMENT';
  END IF;

  UPDATE public.legal_documents SET
    title_ar = btrim(coalesce(_title_ar, title_ar)),
    title_en = btrim(coalesce(_title_en, title_en)),
    body_ar = nullif(btrim(coalesce(_body_ar,'')),''),
    body_en = nullif(btrim(coalesce(_body_en,'')),''),
    meta = coalesce(_meta, meta),
    version = CASE WHEN coalesce(_bump_version,false) THEN version + 1 ELSE version END,
    updated_by = auth.uid()
  WHERE key = _key
  RETURNING version INTO _v;

  IF _v IS NULL THEN RAISE EXCEPTION 'UNKNOWN_LEGAL_DOCUMENT'; END IF;
  RETURN _v;
END $$;

REVOKE ALL ON FUNCTION public.admin_upsert_legal_document(text, text, text, text, text, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_legal_document(text, text, text, text, text, jsonb, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.require_consent(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_applicant_consent() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_publisher_consent() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalize_user_consent() FROM PUBLIC, anon, authenticated;