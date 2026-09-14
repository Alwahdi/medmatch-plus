-- 1) Change requests
CREATE TABLE public.profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE,
  target text NOT NULL CHECK (target IN ('professional','facility','account')),
  field text NOT NULL,
  old_value text,
  new_value text NOT NULL,
  reason text,
  attachment_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profile_change_requests TO authenticated;
GRANT ALL ON public.profile_change_requests TO service_role;

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own change requests"
  ON public.profile_change_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners create own change requests"
  ON public.profile_change_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins review change requests"
  ON public.profile_change_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX profile_change_requests_one_pending
  ON public.profile_change_requests (user_id, target, field)
  WHERE status = 'pending';

CREATE INDEX profile_change_requests_status_idx
  ON public.profile_change_requests (status, created_at DESC);

CREATE TRIGGER profile_change_requests_updated_at
BEFORE UPDATE ON public.profile_change_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Audit log
CREATE TABLE public.profile_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid,
  facility_id uuid,
  target text NOT NULL,
  field text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profile_change_log TO authenticated;
GRANT ALL ON public.profile_change_log TO service_role;

ALTER TABLE public.profile_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads change log"
  ON public.profile_change_log FOR SELECT TO authenticated
  USING (subject_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX profile_change_log_subject_idx
  ON public.profile_change_log (subject_user_id, created_at DESC);

-- 3) Wider locks
CREATE OR REPLACE FUNCTION public.lock_verified_pro_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_verified AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name
       OR NEW.license_number IS DISTINCT FROM OLD.license_number
       OR NEW.license_country IS DISTINCT FROM OLD.license_country
       OR NEW.specialty_id IS DISTINCT FROM OLD.specialty_id
       OR NEW.years_experience IS DISTINCT FROM OLD.years_experience
       OR NEW.city IS DISTINCT FROM OLD.city
       OR NEW.country IS DISTINCT FROM OLD.country THEN
      RAISE EXCEPTION 'Verified professional identity fields cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_verified_facility_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_verified AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.name_ar IS DISTINCT FROM OLD.name_ar
       OR NEW.name_en IS DISTINCT FROM OLD.name_en
       OR NEW.facility_type IS DISTINCT FROM OLD.facility_type
       OR NEW.country IS DISTINCT FROM OLD.country
       OR NEW.city IS DISTINCT FROM OLD.city THEN
      RAISE EXCEPTION 'Verified facility identity fields cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_verified_account_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS DISTINCT FROM OLD.full_name
     AND NOT public.has_role(auth.uid(), 'admin')
     AND EXISTS (
       SELECT 1 FROM public.healthcare_professionals h
       WHERE h.user_id = OLD.id AND h.is_verified
     ) THEN
    RAISE EXCEPTION 'Verified account name cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_verified_account_name() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS lock_verified_account_name ON public.profiles;
CREATE TRIGGER lock_verified_account_name
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.lock_verified_account_name();

-- 4) Audit triggers
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _fields text[];
  _f text;
  _old text;
  _new text;
  _target text;
  _subject uuid;
  _facility uuid;
BEGIN
  IF TG_TABLE_NAME = 'healthcare_professionals' THEN
    _target := 'professional';
    _subject := NEW.user_id;
    _facility := NULL;
    _fields := ARRAY['full_name','license_number','license_country','specialty_id','years_experience','city','country'];
  ELSIF TG_TABLE_NAME = 'facilities' THEN
    _target := 'facility';
    _subject := NEW.user_id;
    _facility := NEW.id;
    _fields := ARRAY['name_ar','name_en','facility_type','country','city'];
  ELSE
    _target := 'account';
    _subject := NEW.id;
    _facility := NULL;
    _fields := ARRAY['full_name','phone','country','city'];
  END IF;

  FOREACH _f IN ARRAY _fields LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', _f, _f)
      INTO _old, _new USING OLD, NEW;
    IF _old IS DISTINCT FROM _new THEN
      INSERT INTO public.profile_change_log
        (subject_user_id, facility_id, target, field, old_value, new_value, changed_by)
      VALUES (_subject, _facility, _target, _f, _old, _new, auth.uid());
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.log_profile_changes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS log_pro_changes ON public.healthcare_professionals;
CREATE TRIGGER log_pro_changes
AFTER UPDATE ON public.healthcare_professionals
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

DROP TRIGGER IF EXISTS log_facility_changes ON public.facilities;
CREATE TRIGGER log_facility_changes
AFTER UPDATE ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

DROP TRIGGER IF EXISTS log_account_changes ON public.profiles;
CREATE TRIGGER log_account_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

-- 5) Admin apply / reject
CREATE OR REPLACE FUNCTION public.review_change_request(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.profile_change_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO r FROM public.profile_change_requests WHERE id = _id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'ALREADY_REVIEWED'; END IF;

  IF _approve THEN
    IF r.target = 'professional' THEN
      IF r.field = 'years_experience' THEN
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1::integer WHERE user_id = $2', r.field)
          USING r.new_value, r.user_id;
      ELSIF r.field = 'specialty_id' THEN
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1::uuid WHERE user_id = $2', r.field)
          USING r.new_value, r.user_id;
      ELSE
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1 WHERE user_id = $2', r.field)
          USING r.new_value, r.user_id;
      END IF;
      IF r.field = 'full_name' THEN
        UPDATE public.profiles SET full_name = r.new_value WHERE id = r.user_id;
      END IF;
    ELSIF r.target = 'facility' THEN
      EXECUTE format('UPDATE public.facilities SET %I = $1 WHERE id = $2', r.field)
        USING r.new_value, r.facility_id;
    ELSE
      EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', r.field)
        USING r.new_value, r.user_id;
    END IF;
  END IF;

  UPDATE public.profile_change_requests
    SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
        review_note = _note,
        reviewed_by = auth.uid(),
        reviewed_at = now()
  WHERE id = _id;

  PERFORM public.push_notification(
    r.user_id,
    'change_request',
    CASE WHEN _approve THEN 'تم قبول طلب تعديل بياناتك' ELSE 'تم رفض طلب تعديل بياناتك' END,
    CASE WHEN _approve THEN 'Data change request approved' ELSE 'Data change request rejected' END,
    COALESCE(_note, r.field),
    COALESCE(_note, r.field),
    CASE WHEN r.target = 'facility' THEN '/facility/profile' ELSE '/profile' END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_change_request(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_change_request(uuid, boolean, text) TO authenticated;