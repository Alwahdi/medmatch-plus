ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY DEFINER;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.can_view_facility_identity(uuid, uuid) SECURITY DEFINER;
ALTER FUNCTION public.can_view_facility_identity(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.has_engagement(uuid, uuid) SECURITY DEFINER;
ALTER FUNCTION public.has_engagement(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_conversation_participant(uuid, uuid) SECURITY DEFINER;
ALTER FUNCTION public.is_conversation_participant(uuid, uuid) SET search_path = public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_facility_identity(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_engagement(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_facility_identity(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_engagement(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "pro reviews visible to related parties" ON public.reviews;
CREATE POLICY "pro reviews visible to related parties" ON public.reviews
FOR SELECT TO authenticated USING (
  direction = 'facility_to_pro' AND (
    professional_user_id = auth.uid()
    OR author_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

ALTER TABLE public.profile_change_requests
ADD CONSTRAINT profile_change_requests_allowed_field CHECK (
  (target = 'professional' AND field IN ('full_name','license_number','license_country','specialty_id','years_experience','city','country'))
  OR (target = 'facility' AND field IN ('name_ar','name_en','facility_type','country','city'))
  OR (target = 'account' AND field IN ('full_name','phone','country','city'))
) NOT VALID;

CREATE OR REPLACE FUNCTION public.review_change_request(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.profile_change_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF length(COALESCE(_note, '')) > 1000 THEN RAISE EXCEPTION 'NOTE_TOO_LONG'; END IF;
  SELECT * INTO r FROM public.profile_change_requests WHERE id = _id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'ALREADY_REVIEWED'; END IF;
  IF NOT (
    (r.target = 'professional' AND r.field IN ('full_name','license_number','license_country','specialty_id','years_experience','city','country'))
    OR (r.target = 'facility' AND r.field IN ('name_ar','name_en','facility_type','country','city'))
    OR (r.target = 'account' AND r.field IN ('full_name','phone','country','city'))
  ) THEN RAISE EXCEPTION 'INVALID_FIELD'; END IF;
  IF _approve THEN
    IF r.target = 'professional' THEN
      IF r.field = 'years_experience' THEN
        IF r.new_value !~ '^([0-9]|[1-5][0-9]|60)$' THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1::integer WHERE user_id = $2', r.field) USING r.new_value, r.user_id;
      ELSIF r.field = 'specialty_id' THEN
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE id = r.new_value::uuid) THEN RAISE EXCEPTION 'INVALID_SPECIALTY'; END IF;
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1::uuid WHERE user_id = $2', r.field) USING r.new_value, r.user_id;
      ELSE
        EXECUTE format('UPDATE public.healthcare_professionals SET %I = $1 WHERE user_id = $2', r.field) USING r.new_value, r.user_id;
      END IF;
      IF r.field = 'full_name' THEN UPDATE public.profiles SET full_name = r.new_value WHERE id = r.user_id; END IF;
    ELSIF r.target = 'facility' THEN
      EXECUTE format('UPDATE public.facilities SET %I = $1 WHERE id = $2', r.field) USING r.new_value, r.facility_id;
    ELSE
      EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', r.field) USING r.new_value, r.user_id;
    END IF;
  END IF;
  UPDATE public.profile_change_requests SET
    status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    review_note = NULLIF(btrim(_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = _id;
  PERFORM public.push_notification(
    r.user_id, 'change_request',
    CASE WHEN _approve THEN 'تم قبول طلب تعديل بياناتك' ELSE 'تم رفض طلب تعديل بياناتك' END,
    CASE WHEN _approve THEN 'Data change request approved' ELSE 'Data change request rejected' END,
    COALESCE(NULLIF(btrim(_note), ''), r.field), COALESCE(NULLIF(btrim(_note), ''), r.field),
    CASE WHEN r.target = 'facility' THEN '/facility/profile' ELSE '/profile' END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.review_change_request(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_change_request(uuid, boolean, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  IF NEW.raw_user_meta_data->>'role' = 'professional' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;