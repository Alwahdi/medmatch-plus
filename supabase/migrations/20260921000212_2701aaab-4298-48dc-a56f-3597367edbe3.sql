CREATE TABLE IF NOT EXISTS public.document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target text NOT NULL CHECK (target IN ('professional','facility')),
  code text NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  min_count integer NOT NULL DEFAULT 1 CHECK (min_count BETWEEN 1 AND 10),
  requires_expiry boolean NOT NULL DEFAULT false,
  requires_issue_date boolean NOT NULL DEFAULT false,
  requires_issuer boolean NOT NULL DEFAULT false,
  note_ar text,
  note_en text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target, code)
);

GRANT SELECT ON public.document_requirements TO authenticated;
GRANT SELECT ON public.document_requirements TO anon;
GRANT ALL ON public.document_requirements TO service_role;

ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read document requirements" ON public.document_requirements;
CREATE POLICY "Anyone can read document requirements"
ON public.document_requirements FOR SELECT USING (true);

DROP TRIGGER IF EXISTS trg_document_requirements_updated_at ON public.document_requirements;
CREATE TRIGGER trg_document_requirements_updated_at
BEFORE UPDATE ON public.document_requirements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.document_requirements
  (target, code, name_ar, name_en, is_required, requires_expiry, sort_order)
VALUES
  ('professional','ترخيص مزاولة المهنة','ترخيص مزاولة المهنة','Professional practice license', true,  true,  1),
  ('professional','بطاقة الهوية / الجواز','بطاقة الهوية / الجواز','ID / Passport',                true,  false, 2),
  ('professional','شهادة البكالوريوس','شهادة البكالوريوس','Bachelor''s degree',                   false, false, 3),
  ('professional','شهادة الزمالة / الماجستير','شهادة الزمالة / الماجستير','Fellowship / Master''s degree', false, false, 4),
  ('professional','شهادة خبرة','شهادة خبرة','Experience certificate',                             false, false, 5),
  ('professional','شهادة دورة تدريبية','شهادة دورة تدريبية','Training certificate',               false, false, 6),
  ('facility','رخصة مزاولة المنشأة','رخصة مزاولة المنشأة','Facility operating license',           true,  true,  1),
  ('facility','السجل التجاري','السجل التجاري','Commercial registration',                          true,  false, 2),
  ('facility','البطاقة الضريبية','البطاقة الضريبية','Tax card',                                   false, false, 3),
  ('facility','هوية المفوّض بالتوقيع','هوية المفوّض بالتوقيع','Authorized signatory ID',          false, false, 4),
  ('facility','شهادة اعتماد أو جودة','شهادة اعتماد أو جودة','Accreditation / quality certificate', false, false, 5)
ON CONFLICT (target, code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_upsert_document_requirement(
  _id uuid,
  _target text,
  _code text,
  _name_ar text,
  _name_en text,
  _is_required boolean,
  _min_count integer,
  _requires_expiry boolean,
  _requires_issue_date boolean,
  _requires_issuer boolean,
  _note_ar text,
  _note_en text,
  _sort_order integer,
  _is_active boolean
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row_id uuid;
BEGIN
  PERFORM public.require_admin_mfa();
  IF _target NOT IN ('professional','facility') THEN
    RAISE EXCEPTION 'UNKNOWN_DOC_TARGET';
  END IF;
  IF coalesce(btrim(_code),'') = '' OR coalesce(btrim(_name_ar),'') = '' THEN
    RAISE EXCEPTION 'DOC_REQUIREMENT_INCOMPLETE';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.document_requirements
      (target, code, name_ar, name_en, is_required, min_count, requires_expiry,
       requires_issue_date, requires_issuer, note_ar, note_en, sort_order, is_active)
    VALUES
      (_target, btrim(_code), btrim(_name_ar), btrim(coalesce(_name_en, _name_ar)),
       coalesce(_is_required,false), coalesce(_min_count,1), coalesce(_requires_expiry,false),
       coalesce(_requires_issue_date,false), coalesce(_requires_issuer,false),
       nullif(btrim(coalesce(_note_ar,'')),''), nullif(btrim(coalesce(_note_en,'')),''),
       coalesce(_sort_order,0), coalesce(_is_active,true))
    RETURNING id INTO _row_id;
  ELSE
    UPDATE public.document_requirements SET
      name_ar = btrim(_name_ar),
      name_en = btrim(coalesce(_name_en, _name_ar)),
      is_required = coalesce(_is_required,false),
      min_count = coalesce(_min_count,1),
      requires_expiry = coalesce(_requires_expiry,false),
      requires_issue_date = coalesce(_requires_issue_date,false),
      requires_issuer = coalesce(_requires_issuer,false),
      note_ar = nullif(btrim(coalesce(_note_ar,'')),''),
      note_en = nullif(btrim(coalesce(_note_en,'')),''),
      sort_order = coalesce(_sort_order,0),
      is_active = coalesce(_is_active,true)
    WHERE id = _id
    RETURNING id INTO _row_id;
    IF _row_id IS NULL THEN
      RAISE EXCEPTION 'DOC_REQUIREMENT_NOT_FOUND';
    END IF;
  END IF;

  RETURN _row_id;
END $$;

REVOKE ALL ON FUNCTION public.admin_upsert_document_requirement(uuid,text,text,text,text,boolean,integer,boolean,boolean,boolean,text,text,integer,boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_upsert_document_requirement(uuid,text,text,text,text,boolean,integer,boolean,boolean,boolean,text,text,integer,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_document_requirement(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _target text; _code text; _used int;
BEGIN
  PERFORM public.require_admin_mfa();
  SELECT target, code INTO _target, _code FROM public.document_requirements WHERE id = _id;
  IF _target IS NULL THEN
    RAISE EXCEPTION 'DOC_REQUIREMENT_NOT_FOUND';
  END IF;

  IF _target = 'professional' THEN
    SELECT count(*) INTO _used FROM public.credentials WHERE doc_type = _code;
  ELSE
    SELECT count(*) INTO _used FROM public.facility_documents WHERE doc_type = _code;
  END IF;

  IF _used > 0 THEN
    UPDATE public.document_requirements SET is_active = false WHERE id = _id;
  ELSE
    DELETE FROM public.document_requirements WHERE id = _id;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.admin_delete_document_requirement(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_document_requirement(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.pro_verification_evidence_ok(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH req AS (
    SELECT code, min_count FROM public.document_requirements
    WHERE target = 'professional' AND is_required AND is_active
  )
  SELECT EXISTS (SELECT 1 FROM req)
     AND NOT EXISTS (
       SELECT 1 FROM req r
       WHERE (
         SELECT count(*) FROM public.credentials c
         WHERE c.user_id = _user_id
           AND c.doc_type = r.code
           AND c.status = 'approved'
           AND (c.expiry_date IS NULL OR c.expiry_date >= current_date)
       ) < r.min_count
     );
$$;

CREATE OR REPLACE FUNCTION private.facility_verification_evidence_ok(_facility_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH req AS (
    SELECT code, min_count FROM public.document_requirements
    WHERE target = 'facility' AND is_required AND is_active
  )
  SELECT EXISTS (SELECT 1 FROM req)
     AND NOT EXISTS (
       SELECT 1 FROM req r
       WHERE (
         SELECT count(*) FROM public.facility_documents d
         WHERE d.facility_id = _facility_id
           AND d.doc_type = r.code
           AND d.status = 'approved'
           AND (d.expiry_date IS NULL OR d.expiry_date >= current_date)
       ) < r.min_count
     );
$$;

CREATE OR REPLACE FUNCTION public.guard_document_requirement_fields()
RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public'
AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.document_requirements
  WHERE target = CASE WHEN TG_TABLE_NAME = 'credentials' THEN 'professional' ELSE 'facility' END
    AND code = NEW.doc_type;

  IF r.id IS NULL OR NOT r.is_active THEN
    RAISE EXCEPTION 'UNKNOWN_DOC_TYPE';
  END IF;
  IF r.requires_expiry AND NEW.expiry_date IS NULL THEN
    RAISE EXCEPTION 'DOC_EXPIRY_REQUIRED';
  END IF;
  IF r.requires_issue_date AND NEW.issue_date IS NULL THEN
    RAISE EXCEPTION 'DOC_ISSUE_DATE_REQUIRED';
  END IF;
  IF r.requires_issuer AND coalesce(btrim(coalesce(NEW.issuer,'')),'') = '' THEN
    RAISE EXCEPTION 'DOC_ISSUER_REQUIRED';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_credentials_requirement_fields ON public.credentials;
CREATE TRIGGER trg_credentials_requirement_fields
BEFORE INSERT ON public.credentials
FOR EACH ROW EXECUTE FUNCTION public.guard_document_requirement_fields();

DROP TRIGGER IF EXISTS trg_facility_documents_requirement_fields ON public.facility_documents;
CREATE TRIGGER trg_facility_documents_requirement_fields
BEFORE INSERT ON public.facility_documents
FOR EACH ROW EXECUTE FUNCTION public.guard_document_requirement_fields();

CREATE OR REPLACE FUNCTION public.admin_user_overview(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _facility_id uuid;
  _result jsonb;
BEGIN
  PERFORM public.require_admin_mfa();

  SELECT f.id INTO _facility_id FROM public.facilities f WHERE f.user_id = _user_id LIMIT 1;

  SELECT jsonb_build_object(
    'user_id', _user_id,
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = _user_id),
    'roles', (SELECT coalesce(jsonb_agg(ur.role), '[]'::jsonb) FROM public.user_roles ur WHERE ur.user_id = _user_id),
    'professional', (SELECT to_jsonb(h) FROM public.healthcare_professionals h WHERE h.user_id = _user_id),
    'specialty', (SELECT to_jsonb(s) FROM public.healthcare_professionals h
                    JOIN public.specialties s ON s.id = h.specialty_id WHERE h.user_id = _user_id),
    'facility', (SELECT to_jsonb(f) FROM public.facilities f WHERE f.id = _facility_id),
    'subscription', (SELECT to_jsonb(fs) FROM public.facility_subscriptions fs
                       WHERE fs.facility_id = _facility_id ORDER BY fs.created_at DESC LIMIT 1),
    'credentials', (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.created_at DESC), '[]'::jsonb)
                      FROM public.credentials c WHERE c.user_id = _user_id),
    'facility_documents', (SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC), '[]'::jsonb)
                      FROM public.facility_documents d WHERE d.facility_id = _facility_id),
    'change_requests', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
                      FROM public.profile_change_requests r WHERE r.user_id = _user_id),
    'change_log', (SELECT coalesce(jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC), '[]'::jsonb)
                      FROM (SELECT * FROM public.profile_change_log g
                            WHERE g.subject_user_id = _user_id OR g.facility_id = _facility_id
                            ORDER BY g.created_at DESC LIMIT 50) l),
    'reports', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                          'id', sr.id, 'category', sr.category, 'status', sr.status,
                          'details', sr.details, 'created_at', sr.created_at) ORDER BY sr.created_at DESC), '[]'::jsonb)
                      FROM public.safety_reports sr
                      WHERE (sr.target_type = 'professional' AND sr.target_id = _user_id)
                         OR (sr.target_type = 'facility' AND sr.target_id = _facility_id)),
    'stats', jsonb_build_object(
      'applications', (SELECT count(*) FROM public.applications a WHERE a.user_id = _user_id),
      'hired', (SELECT count(*) FROM public.applications a WHERE a.user_id = _user_id AND a.status = 'accepted'),
      'shift_bookings', (SELECT count(*) FROM public.shift_bookings b WHERE b.user_id = _user_id),
      'shifts_completed', (SELECT count(*) FROM public.shift_bookings b
                             JOIN public.shifts s ON s.id = b.shift_id
                             WHERE b.user_id = _user_id AND s.status = 'completed'),
      'hours_worked', (SELECT coalesce(round(sum(EXTRACT(EPOCH FROM (s.ends_at - s.starts_at)) / 3600)), 0)
                         FROM public.shift_bookings b JOIN public.shifts s ON s.id = b.shift_id
                         WHERE b.user_id = _user_id AND s.status = 'completed'),
      'interviews', (SELECT count(*) FROM public.interviews i
                       WHERE i.professional_user_id = _user_id OR i.facility_id = _facility_id),
      'jobs_posted', (SELECT count(*) FROM public.jobs j WHERE j.facility_id = _facility_id),
      'shifts_posted', (SELECT count(*) FROM public.shifts s WHERE s.facility_id = _facility_id),
      'reviews_received', (SELECT count(*) FROM public.reviews r
                             WHERE (r.direction = 'facility_to_pro' AND r.professional_user_id = _user_id)
                                OR (r.direction = 'pro_to_facility' AND r.facility_id = _facility_id))
    )
  ) INTO _result;

  RETURN _result;
END $$;

REVOKE ALL ON FUNCTION public.admin_user_overview(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_user_overview(uuid) TO authenticated;