-- clearer stage notifications
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
  IF NEW.status IS DISTINCT FROM OLD.status THEN
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
      _ar, _en, '/applications');
  END IF;
  RETURN NEW;
END; $function$;

-- move an application between pipeline stages (facility owner only)
CREATE OR REPLACE FUNCTION public.set_application_stage(_application_id uuid, _status application_status)
RETURNS application_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job_id uuid; _owner uuid; _cur application_status; _active boolean;
BEGIN
  SELECT a.job_id, a.status, f.user_id, j.is_active
    INTO _job_id, _cur, _owner, _active
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  JOIN public.facilities f ON f.id = j.facility_id
  WHERE a.id = _application_id;

  IF _job_id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _status IN ('hired') THEN RAISE EXCEPTION 'USE_HIRE_APPLICANT'; END IF;
  IF _cur = 'hired' THEN RAISE EXCEPTION 'ALREADY_HIRED'; END IF;
  IF NOT _active AND _status <> 'rejected' THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  UPDATE public.applications SET status = _status WHERE id = _application_id;
  RETURN _status;
END; $function$;

-- select a candidate; closes the job when all vacancies are filled
CREATE OR REPLACE FUNCTION public.hire_applicant(_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job public.jobs%ROWTYPE; _owner uuid; _cur application_status; _hired int; _closed boolean := false; _r record;
BEGIN
  SELECT a.status INTO _cur FROM public.applications a WHERE a.id = _application_id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  SELECT j.* INTO _job FROM public.jobs j
  JOIN public.applications a ON a.job_id = j.id
  WHERE a.id = _application_id
  FOR UPDATE OF j;

  SELECT f.user_id INTO _owner FROM public.facilities f WHERE f.id = _job.facility_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _cur = 'hired' THEN RAISE EXCEPTION 'ALREADY_HIRED'; END IF;
  IF NOT _job.is_active THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  SELECT count(*) INTO _hired FROM public.applications WHERE job_id = _job.id AND status = 'hired';
  IF _hired >= GREATEST(_job.vacancies, 1) THEN RAISE EXCEPTION 'VACANCIES_FILLED'; END IF;

  UPDATE public.applications SET status = 'hired' WHERE id = _application_id;
  _hired := _hired + 1;

  IF _hired >= GREATEST(_job.vacancies, 1) THEN
    UPDATE public.jobs SET is_active = false WHERE id = _job.id;
    _closed := true;
    FOR _r IN
      SELECT id FROM public.applications
      WHERE job_id = _job.id AND status NOT IN ('hired', 'rejected')
    LOOP
      UPDATE public.applications SET status = 'rejected' WHERE id = _r.id;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('hired', _hired, 'vacancies', GREATEST(_job.vacancies, 1), 'closed', _closed);
END; $function$;

-- undo a selection while the job is still open
CREATE OR REPLACE FUNCTION public.unhire_applicant(_application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _owner uuid; _active boolean; _cur application_status;
BEGIN
  SELECT a.status, f.user_id, j.is_active INTO _cur, _owner, _active
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  JOIN public.facilities f ON f.id = j.facility_id
  WHERE a.id = _application_id;

  IF _cur IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _cur <> 'hired' THEN RAISE EXCEPTION 'NOT_HIRED'; END IF;
  IF NOT _active THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  UPDATE public.applications SET status = 'interview' WHERE id = _application_id;
END; $function$;

REVOKE UPDATE ON public.applications FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_application_stage(uuid, application_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hire_applicant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unhire_applicant(uuid) TO authenticated;