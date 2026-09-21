-- 1) close_job: إغلاق يدوي + إنهاء الطلبات المعلّقة
CREATE OR REPLACE FUNCTION public.close_job(_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job public.jobs%ROWTYPE; _owner uuid; _ended int := 0; _r record;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT j.* INTO _job FROM public.jobs j WHERE j.id = _job_id FOR UPDATE;
  IF _job.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  SELECT f.user_id INTO _owner FROM public.facilities f WHERE f.id = _job.facility_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  IF _job.is_active THEN
    UPDATE public.jobs SET is_active = false, auto_closed = false WHERE id = _job.id;
  END IF;

  FOR _r IN SELECT id FROM public.applications
             WHERE job_id = _job.id AND status NOT IN ('hired','rejected','withdrawn') LOOP
    UPDATE public.applications SET status = 'rejected', updated_at = now() WHERE id = _r.id;
    _ended := _ended + 1;
  END LOOP;

  RETURN jsonb_build_object('ended', _ended);
END; $function$;

REVOKE ALL ON FUNCTION public.close_job(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.close_job(uuid) TO authenticated;

-- 2) reopen_job: منع إعادة نشر الوظيفة المكتملة
CREATE OR REPLACE FUNCTION public.reopen_job(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job public.jobs%ROWTYPE; _owner uuid; _hired int;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT j.* INTO _job FROM public.jobs j WHERE j.id = _job_id FOR UPDATE;
  IF _job.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  SELECT f.user_id INTO _owner FROM public.facilities f WHERE f.id = _job.facility_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT count(*) INTO _hired FROM public.applications WHERE job_id = _job.id AND status = 'hired';
  IF _job.auto_closed OR _hired >= GREATEST(_job.vacancies, 1) THEN
    RAISE EXCEPTION 'JOB_FILLED_USE_COPY';
  END IF;

  UPDATE public.jobs SET is_active = true, auto_closed = false WHERE id = _job.id;
END; $function$;

REVOKE ALL ON FUNCTION public.reopen_job(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.reopen_job(uuid) TO authenticated;

-- 3) إشعار التقييم عند التوظيف
CREATE OR REPLACE FUNCTION public.hire_applicant(_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job public.jobs%ROWTYPE; _owner uuid; _cur application_status; _hired int; _closed boolean := false; _r record; _pro uuid;
BEGIN
  PERFORM public.require_mfa();
  SELECT a.status, a.user_id INTO _cur, _pro FROM public.applications a WHERE a.id=_application_id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  SELECT j.* INTO _job FROM public.jobs j JOIN public.applications a ON a.job_id=j.id
   WHERE a.id=_application_id FOR UPDATE OF j;

  SELECT f.user_id INTO _owner FROM public.facilities f WHERE f.id=_job.facility_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _cur = 'withdrawn' THEN RAISE EXCEPTION 'APPLICATION_WITHDRAWN'; END IF;
  IF _cur = 'rejected' THEN RAISE EXCEPTION 'APPLICATION_REJECTED'; END IF;
  IF _cur = 'hired' THEN RAISE EXCEPTION 'ALREADY_HIRED'; END IF;
  IF NOT _job.is_active THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  SELECT count(*) INTO _hired FROM public.applications WHERE job_id=_job.id AND status='hired';
  IF _hired >= GREATEST(_job.vacancies,1) THEN RAISE EXCEPTION 'VACANCIES_FILLED'; END IF;

  UPDATE public.applications SET status='hired' WHERE id=_application_id;
  _hired := _hired + 1;

  IF _hired >= GREATEST(_job.vacancies,1) THEN
    UPDATE public.jobs SET is_active=false, auto_closed=true WHERE id=_job.id;
    _closed := true;
    FOR _r IN SELECT id FROM public.applications
               WHERE job_id=_job.id AND status NOT IN ('hired','rejected','withdrawn') LOOP
      UPDATE public.applications SET status='rejected' WHERE id=_r.id;
    END LOOP;
  END IF;

  PERFORM public.push_notification(_pro, 'review_request', 'قيّم تجربتك', 'Rate your experience',
    'شارك تقييمك للمنشأة بعد اختيارك لوظيفة: ' || _job.title,
    'Share your rating for the facility after being selected for: ' || _job.title,
    '/activity?tab=applications');
  PERFORM public.push_notification(_owner, 'review_request', 'قيّم تجربتك', 'Rate your experience',
    'شارك تقييمك للمختص الذي وظّفته في: ' || _job.title,
    'Share your rating for the professional you hired for: ' || _job.title,
    '/facility/applicants/' || _job.id::text);

  RETURN jsonb_build_object('hired', _hired, 'vacancies', GREATEST(_job.vacancies,1), 'closed', _closed);
END; $function$;

-- 4) إشعار التقييم عند إنهاء المناوبة
CREATE OR REPLACE FUNCTION public.complete_shift(_shift_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _id uuid; _pro uuid; _owner uuid; _title text;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  UPDATE public.shifts s
  SET status = 'completed', updated_at = now()
  WHERE s.id = _shift_id
    AND s.status = 'booked'
    AND s.ends_at <= now()
    AND EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = s.facility_id AND f.user_id = auth.uid())
  RETURNING s.id, s.booked_by, s.title INTO _id, _pro, _title;
  IF _id IS NULL THEN RAISE EXCEPTION 'SHIFT_NOT_COMPLETABLE'; END IF;

  _owner := auth.uid();
  IF _pro IS NOT NULL THEN
    PERFORM public.push_notification(_pro, 'review_request', 'قيّم تجربتك', 'Rate your experience',
      'شارك تقييمك للمنشأة بعد إتمام المناوبة: ' || COALESCE(_title,''),
      'Share your rating for the facility after completing: ' || COALESCE(_title,''),
      '/my-shifts');
    PERFORM public.push_notification(_owner, 'review_request', 'قيّم تجربتك', 'Rate your experience',
      'شارك تقييمك للمختص بعد إتمام المناوبة: ' || COALESCE(_title,''),
      'Share your rating for the professional after completing: ' || COALESCE(_title,''),
      '/facility?tab=bookings');
  END IF;
  RETURN _id;
END; $function$;