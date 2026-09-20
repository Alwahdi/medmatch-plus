-- Phase 58 (B): withdrawal columns, recomputed counts, RPCs
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawal_reason text;

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_withdraw_ck;
ALTER TABLE public.applications
  ADD CONSTRAINT applications_withdraw_ck CHECK (
    (status = 'withdrawn' AND withdrawn_at IS NOT NULL
      AND (withdrawal_reason IS NULL OR length(withdrawal_reason) <= 500))
    OR (status <> 'withdrawn' AND withdrawn_at IS NULL AND withdrawal_reason IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_applications_job_status ON public.applications (job_id, status);

-- Idempotent recompute of jobs.applications_count (active, non-withdrawn applications)
CREATE OR REPLACE FUNCTION public.bump_job_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job uuid;
BEGIN
  FOR _job IN
    SELECT DISTINCT j FROM unnest(ARRAY[
      CASE WHEN TG_OP <> 'INSERT' THEN OLD.job_id END,
      CASE WHEN TG_OP <> 'DELETE' THEN NEW.job_id END
    ]) AS j WHERE j IS NOT NULL
  LOOP
    UPDATE public.jobs
       SET applications_count = (
         SELECT count(*) FROM public.applications a
          WHERE a.job_id = _job AND a.status <> 'withdrawn'
       )
     WHERE id = _job;
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS count_trg ON public.applications;
DROP TRIGGER IF EXISTS applications_count_trg ON public.applications;
CREATE TRIGGER applications_count_trg
AFTER INSERT OR DELETE OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.bump_job_applications();

-- Candidate should not be notified about their own withdrawal
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
      _ar, _en, '/applications');
  END IF;
  RETURN NEW;
END; $function$;

-- Professional withdrawal
CREATE OR REPLACE FUNCTION public.withdraw_job_application(_application_id uuid, _reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _cur public.application_status; _owner uuid; _job uuid; _title text; _fac_user uuid; _reason_clean text;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT a.status, a.user_id, a.job_id INTO _cur, _owner, _job
    FROM public.applications a WHERE a.id = _application_id FOR UPDATE;
  IF _cur IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _cur = 'withdrawn' THEN RETURN _application_id; END IF;
  IF _cur IN ('hired','rejected') THEN RAISE EXCEPTION 'APPLICATION_NOT_WITHDRAWABLE'; END IF;

  _reason_clean := NULLIF(btrim(COALESCE(_reason,'')), '');
  IF _reason_clean IS NOT NULL AND length(_reason_clean) > 500 THEN
    RAISE EXCEPTION 'WITHDRAW_REASON_TOO_LONG';
  END IF;

  UPDATE public.applications
     SET status = 'withdrawn', withdrawn_at = now(), withdrawal_reason = _reason_clean, updated_at = now()
   WHERE id = _application_id;

  UPDATE public.interviews
     SET status = 'cancelled', updated_at = now()
   WHERE application_id = _application_id
     AND status IN ('scheduled','confirmed');

  SELECT j.title, f.user_id INTO _title, _fac_user
    FROM public.jobs j JOIN public.facilities f ON f.id = j.facility_id
   WHERE j.id = _job;

  IF _fac_user IS NOT NULL THEN
    PERFORM public.push_notification(
      _fac_user, 'application_withdrawn',
      'سحب مرشح طلبه', 'A candidate withdrew their application',
      'تم سحب طلب تقديم على وظيفة: ' || COALESCE(_title,''),
      'An application was withdrawn for: ' || COALESCE(_title,''),
      '/facility'
    );
  END IF;

  RETURN _application_id;
END; $function$;

REVOKE ALL ON FUNCTION public.withdraw_job_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_job_application(uuid, text) TO authenticated, service_role;

-- Re-apply support
CREATE OR REPLACE FUNCTION public.submit_job_application(_job_id uuid, _cover_letter text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _application_id uuid; _cur public.application_status; _cover text;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  IF length(COALESCE(_cover_letter, '')) > 2000 THEN RAISE EXCEPTION 'COVER_TOO_LONG'; END IF;
  _cover := NULLIF(btrim(COALESCE(_cover_letter,'')), '');

  PERFORM 1 FROM public.jobs j
  WHERE j.id = _job_id AND j.is_active AND (j.expires_at IS NULL OR j.expires_at > now())
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  SELECT a.id, a.status INTO _application_id, _cur
    FROM public.applications a
   WHERE a.job_id = _job_id AND a.user_id = auth.uid()
   FOR UPDATE;

  IF _application_id IS NOT NULL THEN
    IF _cur = 'withdrawn' THEN
      UPDATE public.applications
         SET status = 'submitted', withdrawn_at = NULL, withdrawal_reason = NULL,
             cover_letter = _cover, updated_at = now()
       WHERE id = _application_id;
    END IF;
    RETURN _application_id;
  END IF;

  INSERT INTO public.applications (job_id, user_id, cover_letter)
  VALUES (_job_id, auth.uid(), _cover)
  ON CONFLICT (job_id, user_id) DO UPDATE SET job_id = EXCLUDED.job_id
  RETURNING id INTO _application_id;
  RETURN _application_id;
END; $function$;

-- Facility workflow: withdrawn is candidate-owned and terminal for facility actions
CREATE OR REPLACE FUNCTION public.set_application_stage(_application_id uuid, _status application_status)
RETURNS application_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job_id uuid; _owner uuid; _cur application_status; _active boolean;
BEGIN
  PERFORM public.require_mfa();
  SELECT a.job_id, a.status, f.user_id, j.is_active
    INTO _job_id, _cur, _owner, _active
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  JOIN public.facilities f ON f.id = j.facility_id
  WHERE a.id = _application_id;

  IF _job_id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _status = 'withdrawn' THEN RAISE EXCEPTION 'WITHDRAW_IS_CANDIDATE_ONLY'; END IF;
  IF _cur = 'withdrawn' THEN RAISE EXCEPTION 'APPLICATION_WITHDRAWN'; END IF;
  IF _status IN ('hired') THEN RAISE EXCEPTION 'USE_HIRE_APPLICANT'; END IF;
  IF _cur = 'hired' THEN RAISE EXCEPTION 'ALREADY_HIRED'; END IF;
  IF NOT _active AND _status <> 'rejected' THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  UPDATE public.applications SET status = _status WHERE id = _application_id;
  RETURN _status;
END; $function$;

CREATE OR REPLACE FUNCTION public.hire_applicant(_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _job public.jobs%ROWTYPE; _owner uuid; _cur application_status; _hired int; _closed boolean := false; _r record;
BEGIN
  PERFORM public.require_mfa();
  SELECT a.status INTO _cur FROM public.applications a WHERE a.id=_application_id;
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

  RETURN jsonb_build_object('hired', _hired, 'vacancies', GREATEST(_job.vacancies,1), 'closed', _closed);
END; $function$;

-- Align existing counters with the new definition
UPDATE public.jobs j
   SET applications_count = (
     SELECT count(*) FROM public.applications a WHERE a.job_id = j.id AND a.status <> 'withdrawn'
   )
 WHERE j.applications_count IS DISTINCT FROM (
     SELECT count(*) FROM public.applications a WHERE a.job_id = j.id AND a.status <> 'withdrawn'
   );