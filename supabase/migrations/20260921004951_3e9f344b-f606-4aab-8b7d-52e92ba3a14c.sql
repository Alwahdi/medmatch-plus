-- روابط إشعارات تفصيلية تصل للعنصر نفسه بدل صفحة عامة.

CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _recipient uuid; _fac_user uuid; _pro uuid;
BEGIN
  SELECT f.user_id, c.professional_user_id
    INTO _fac_user, _pro
  FROM public.conversations c
  LEFT JOIN public.facilities f ON f.id = c.facility_id
  WHERE c.id = NEW.conversation_id;

  _recipient := CASE WHEN NEW.sender_id = _pro THEN _fac_user ELSE _pro END;
  IF _recipient IS NULL OR _recipient = NEW.sender_id THEN RETURN NEW; END IF;

  -- لا مقتطف من نص الرسالة ولا اسم مرفق ولا موضوع: العنوان العام فقط.
  PERFORM public.push_notification(
    _recipient,
    'message',
    'رسالة جديدة',
    'New message',
    NULL,
    NULL,
    '/messages?c=' || NEW.conversation_id::text
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _fac_user uuid; _title text; _ar text; _en text;
BEGIN
  SELECT f.user_id, j.title INTO _fac_user, _title
  FROM public.jobs j JOIN public.facilities f ON f.id = j.facility_id WHERE j.id = NEW.job_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.push_notification(_fac_user, 'application', 'طلب توظيف جديد', 'New job application',
      _title, _title, '/jobs/' || NEW.job_id::text);
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'withdrawn' THEN
    _ar := CASE NEW.status
      WHEN 'hired' THEN 'تم اختيارك لوظيفة: ' || _title
      WHEN 'rejected' THEN 'لم يقع الاختيار عليك لوظيفة: ' || _title
      WHEN 'reviewing' THEN 'طلبك قيد المراجعة: ' || _title
      WHEN 'interview' THEN 'وصل طلبك لمرحلة المقابلة/العرض: ' || _title
      ELSE 'تحديث على طلبك: ' || _title END;
    _en := CASE NEW.status
      WHEN 'hired' THEN 'You were selected for: ' || _title
      WHEN 'rejected' THEN 'You were not selected for: ' || _title
      WHEN 'reviewing' THEN 'Your application is under review: ' || _title
      WHEN 'interview' THEN 'Your application reached interview/offer: ' || _title
      ELSE 'Application update: ' || _title END;
    PERFORM public.push_notification(NEW.user_id, 'application_status', 'تحديث على طلبك', 'Application update',
      _ar, _en, '/activity?tab=applications#app-' || NEW.id::text);
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.notify_invitation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _fac_user uuid; _link text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.push_notification(NEW.professional_user_id, 'invitation', 'دعوة عمل جديدة', 'New work invitation',
      'وصلتك دعوة للعمل، اطّلع عليها الآن', 'You received a new work invitation',
      '/invitations#inv-' || NEW.id::text);
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','declined') THEN
    SELECT user_id INTO _fac_user FROM public.facilities WHERE id = NEW.facility_id;
    _link := CASE
      WHEN NEW.job_id IS NOT NULL THEN '/jobs/' || NEW.job_id::text
      WHEN NEW.shift_id IS NOT NULL THEN '/shifts/' || NEW.shift_id::text
      ELSE '/facility' END;
    PERFORM public.push_notification(_fac_user, 'invitation_response',
      CASE WHEN NEW.status = 'accepted' THEN 'تم قبول دعوتك' ELSE 'تم رفض دعوتك' END,
      CASE WHEN NEW.status = 'accepted' THEN 'Invitation accepted' ELSE 'Invitation declined' END,
      NULL, NULL, _link);
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.notify_shift_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _fac_user uuid; _title text;
BEGIN
  IF NEW.status <> 'confirmed' THEN RETURN NEW; END IF;
  SELECT f.user_id, s.title INTO _fac_user, _title
  FROM public.shifts s JOIN public.facilities f ON f.id = s.facility_id WHERE s.id = NEW.shift_id;
  IF _fac_user IS NULL THEN RETURN NEW; END IF;
  PERFORM public.push_notification(_fac_user, 'shift_booking', 'حجز مناوبة جديد', 'New shift booking',
    _title, _title, '/shifts/' || NEW.shift_id::text);
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.notify_credential()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
    PERFORM public.push_notification(NEW.user_id, 'credential',
      CASE WHEN NEW.status = 'approved' THEN 'تم اعتماد وثيقتك' ELSE 'تم رفض وثيقتك' END,
      CASE WHEN NEW.status = 'approved' THEN 'Document approved' ELSE 'Document rejected' END,
      NEW.title, NEW.title, '/profile?tab=credentials#cred-' || NEW.id::text);
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.notify_facility_document()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        '/facility/verification#doc-' || NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _fac_user uuid;
BEGIN
  IF NEW.direction = 'pro_to_facility' THEN
    SELECT user_id INTO _fac_user FROM public.facilities WHERE id = NEW.facility_id;
    PERFORM public.push_notification(_fac_user, 'review', 'تقييم جديد لمنشأتك', 'New review for your facility',
      NULL, NULL, '/facilities/' || NEW.facility_id::text);
  ELSE
    PERFORM public.push_notification(NEW.professional_user_id, 'review', 'تقييم جديد لملفك', 'New review on your profile',
      NULL, NULL, '/profile?tab=reviews');
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.notify_contact_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _admin uuid;
BEGIN
  FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.push_notification(_admin, 'contact', 'رسالة تواصل جديدة', 'New contact message',
      left(NEW.message, 120), left(NEW.message, 120), '/admin?tab=inbox');
  END LOOP;
  RETURN NEW;
END; $function$;
