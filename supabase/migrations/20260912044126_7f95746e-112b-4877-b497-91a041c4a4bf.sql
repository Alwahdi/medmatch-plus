CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  body_ar text,
  body_en text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.push_notification(
  _user_id uuid, _type text, _title_ar text, _title_en text,
  _body_ar text DEFAULT NULL, _body_en text DEFAULT NULL, _link text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  VALUES (_user_id, _type, _title_ar, _title_en, _body_ar, _body_en, _link);
END; $$;
REVOKE EXECUTE ON FUNCTION public.push_notification(uuid,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;

-- messages
CREATE OR REPLACE FUNCTION public.notify_new_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _recipient uuid; _fac_user uuid; _pro uuid;
BEGIN
  SELECT f.user_id, c.professional_user_id INTO _fac_user, _pro
  FROM public.conversations c LEFT JOIN public.facilities f ON f.id = c.facility_id
  WHERE c.id = NEW.conversation_id;
  _recipient := CASE WHEN NEW.sender_id = _pro THEN _fac_user ELSE _pro END;
  IF _recipient IS NULL OR _recipient = NEW.sender_id THEN RETURN NEW; END IF;
  PERFORM public.push_notification(_recipient, 'message', 'رسالة جديدة', 'New message',
    left(NEW.body, 120), left(NEW.body, 120), '/messages');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- invitations
CREATE OR REPLACE FUNCTION public.notify_invitation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _fac_user uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.push_notification(NEW.professional_user_id, 'invitation', 'دعوة عمل جديدة', 'New work invitation',
      'وصلتك دعوة للعمل، اطّلع عليها الآن', 'You received a new work invitation', '/invitations');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','declined') THEN
    SELECT user_id INTO _fac_user FROM public.facilities WHERE id = NEW.facility_id;
    PERFORM public.push_notification(_fac_user, 'invitation_response',
      CASE WHEN NEW.status = 'accepted' THEN 'تم قبول دعوتك' ELSE 'تم رفض دعوتك' END,
      CASE WHEN NEW.status = 'accepted' THEN 'Invitation accepted' ELSE 'Invitation declined' END,
      NULL, NULL, '/facility');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_invitation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER invitations_notify AFTER INSERT OR UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.notify_invitation();

-- applications
CREATE OR REPLACE FUNCTION public.notify_application() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _fac_user uuid; _title text;
BEGIN
  SELECT f.user_id, j.title INTO _fac_user, _title
  FROM public.jobs j JOIN public.facilities f ON f.id = j.facility_id WHERE j.id = NEW.job_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.push_notification(_fac_user, 'application', 'طلب توظيف جديد', 'New job application',
      _title, _title, '/facility');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.push_notification(NEW.user_id, 'application_status', 'تحديث على طلبك', 'Application update',
      _title, _title, '/applications');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_application() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER applications_notify AFTER INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.notify_application();

-- shift bookings
CREATE OR REPLACE FUNCTION public.notify_shift_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _fac_user uuid; _title text;
BEGIN
  SELECT f.user_id, s.title INTO _fac_user, _title
  FROM public.shifts s JOIN public.facilities f ON f.id = s.facility_id WHERE s.id = NEW.shift_id;
  PERFORM public.push_notification(_fac_user, 'shift_booking', 'حجز مناوبة جديد', 'New shift booking',
    _title, _title, '/facility');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_shift_booking() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER shift_bookings_notify AFTER INSERT ON public.shift_bookings FOR EACH ROW EXECUTE FUNCTION public.notify_shift_booking();

-- credentials review
CREATE OR REPLACE FUNCTION public.notify_credential() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
    PERFORM public.push_notification(NEW.user_id, 'credential',
      CASE WHEN NEW.status = 'approved' THEN 'تم اعتماد وثيقتك' ELSE 'تم رفض وثيقتك' END,
      CASE WHEN NEW.status = 'approved' THEN 'Document approved' ELSE 'Document rejected' END,
      NEW.title, NEW.title, '/credentials');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_credential() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER credentials_notify AFTER UPDATE ON public.credentials FOR EACH ROW EXECUTE FUNCTION public.notify_credential();

-- reviews
CREATE OR REPLACE FUNCTION public.notify_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _fac_user uuid;
BEGIN
  IF NEW.direction = 'pro_to_facility' THEN
    SELECT user_id INTO _fac_user FROM public.facilities WHERE id = NEW.facility_id;
    PERFORM public.push_notification(_fac_user, 'review', 'تقييم جديد لمنشأتك', 'New review for your facility', NULL, NULL, '/facility');
  ELSE
    PERFORM public.push_notification(NEW.professional_user_id, 'review', 'تقييم جديد لملفك', 'New review on your profile', NULL, NULL, '/profile');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_review() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER reviews_notify AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.notify_review();

-- contact messages -> admins
CREATE OR REPLACE FUNCTION public.notify_contact_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _admin uuid;
BEGIN
  FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.push_notification(_admin, 'contact', 'رسالة تواصل جديدة', 'New contact message',
      left(NEW.message, 120), left(NEW.message, 120), '/admin');
  END LOOP;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_contact_message() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER contact_messages_notify AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.notify_contact_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;