-- Phase82: canonical notification links

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
      _title, _title, '/facility');
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
      _ar, _en, '/activity?tab=applications');
  END IF;
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
      NEW.title, NEW.title, '/profile?tab=credentials');
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.cancel_facility_shift(_shift_id uuid, _reason text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _status shift_status;
  _facility_id uuid;
  _title text;
  _pro uuid;
  _booking uuid;
  _reason_clean text := NULLIF(btrim(COALESCE(_reason, '')), '');
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF length(COALESCE(_reason_clean, '')) > 300 THEN RAISE EXCEPTION 'REASON_TOO_LONG'; END IF;

  SELECT s.status, s.facility_id, s.title
    INTO _status, _facility_id, _title
  FROM public.shifts s
  WHERE s.id = _shift_id
  FOR UPDATE;

  IF _facility_id IS NULL THEN RAISE EXCEPTION 'SHIFT_NOT_FOUND'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.id = _facility_id AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF _status = 'cancelled' THEN
    RETURN _shift_id; -- idempotent
  END IF;

  IF _status = 'completed' THEN
    RAISE EXCEPTION 'SHIFT_FINAL_STATE';
  END IF;

  SELECT b.id, b.user_id INTO _booking, _pro
  FROM public.shift_bookings b
  WHERE b.shift_id = _shift_id AND b.status = 'confirmed'
  FOR UPDATE
  LIMIT 1;

  IF _booking IS NOT NULL THEN
    UPDATE public.shift_bookings
    SET status = 'cancelled',
        cancelled_at = now(),
        cancellation_actor = 'facility',
        cancellation_reason = _reason_clean
    WHERE id = _booking;

    UPDATE public.interviews
    SET status = 'cancelled', updated_at = now()
    WHERE shift_booking_id = _booking
      AND status IN ('scheduled','confirmed');
  END IF;

  UPDATE public.shifts
  SET status = 'cancelled', booked_by = NULL, updated_at = now()
  WHERE id = _shift_id;

  IF _pro IS NOT NULL THEN
    PERFORM public.push_notification(
      _pro,
      'shift_cancelled',
      'أُلغيت مناوبة كنت قد حجزتها',
      'A shift you booked was cancelled',
      COALESCE(_title, '') || CASE WHEN _reason_clean IS NULL THEN '' ELSE ' — ' || _reason_clean END,
      COALESCE(_title, '') || CASE WHEN _reason_clean IS NULL THEN '' ELSE ' — ' || _reason_clean END,
      '/activity?tab=shifts'
    );
  END IF;

  RETURN _shift_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_facility_shift(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_facility_shift(uuid, text) TO authenticated, service_role;

-- إصلاح الروابط المحفوظة سابقاً
UPDATE public.notifications SET link = '/activity?tab=applications' WHERE link = '/applications';
UPDATE public.notifications SET link = '/activity?tab=shifts' WHERE link = '/my-shifts';
UPDATE public.notifications SET link = '/activity?tab=saved' WHERE link = '/saved';
UPDATE public.notifications SET link = '/profile?tab=credentials' WHERE link = '/credentials';
UPDATE public.notifications SET link = '/settings?tab=alerts' WHERE link IN ('/alerts', '/preferences');