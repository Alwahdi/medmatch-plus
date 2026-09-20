CREATE OR REPLACE FUNCTION public.update_job_listing(
  _job_id uuid,
  _title text,
  _description text,
  _specialty_id uuid,
  _employment_type public.employment_type,
  _country text,
  _city text,
  _salary_min numeric,
  _salary_max numeric,
  _currency text,
  _min_experience integer,
  _required_license text,
  _vacancies integer,
  _expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job public.jobs%ROWTYPE;
  _hired integer;
  _apps integer;
  _changed text[] := ARRAY[]::text[];
  _diff jsonb := '{}'::jsonb;
  _notified integer := 0;
  _uid uuid := auth.uid();
  _rec record;
BEGIN
  PERFORM public.require_mfa();
  IF _uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF _job.id IS NULL THEN RAISE EXCEPTION 'JOB_NOT_FOUND'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = _job.facility_id AND f.user_id = _uid) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF length(btrim(COALESCE(_title,''))) < 3 THEN RAISE EXCEPTION 'TITLE_REQUIRED'; END IF;
  IF length(btrim(COALESCE(_description,''))) < 20 THEN RAISE EXCEPTION 'DESCRIPTION_REQUIRED'; END IF;
  IF _salary_min IS NULL OR _salary_max IS NULL OR _salary_min < 0 OR _salary_max < _salary_min THEN
    RAISE EXCEPTION 'SALARY_RANGE_INVALID';
  END IF;
  IF _min_experience IS NULL OR _min_experience < 0 OR _min_experience > 60 THEN
    RAISE EXCEPTION 'EXPERIENCE_INVALID';
  END IF;
  IF _vacancies IS NULL OR _vacancies < 1 THEN RAISE EXCEPTION 'VACANCIES_INVALID'; END IF;

  SELECT count(*) FILTER (WHERE a.status = 'hired'),
         count(*) FILTER (WHERE a.status <> 'withdrawn')
    INTO _hired, _apps
  FROM public.applications a WHERE a.job_id = _job_id;

  IF _vacancies < _hired THEN RAISE EXCEPTION 'VACANCIES_BELOW_HIRED'; END IF;

  IF _expires_at IS NOT NULL AND _job.is_active AND _expires_at <= now() THEN
    RAISE EXCEPTION 'EXPIRY_IN_PAST';
  END IF;

  IF btrim(_title) IS DISTINCT FROM _job.title THEN
    _changed := array_append(_changed, 'title');
    _diff := _diff || jsonb_build_object('title', jsonb_build_object('old', _job.title, 'new', btrim(_title)));
  END IF;
  IF btrim(_description) IS DISTINCT FROM _job.description THEN
    _changed := array_append(_changed, 'description');
  END IF;
  IF _specialty_id IS DISTINCT FROM _job.specialty_id THEN
    _changed := array_append(_changed, 'specialty_id');
    _diff := _diff || jsonb_build_object('specialty_id', jsonb_build_object('old', _job.specialty_id, 'new', _specialty_id));
  END IF;
  IF _employment_type IS DISTINCT FROM _job.employment_type THEN
    _changed := array_append(_changed, 'employment_type');
    _diff := _diff || jsonb_build_object('employment_type', jsonb_build_object('old', _job.employment_type, 'new', _employment_type));
  END IF;
  IF _country IS DISTINCT FROM _job.country THEN
    _changed := array_append(_changed, 'country');
    _diff := _diff || jsonb_build_object('country', jsonb_build_object('old', _job.country, 'new', _country));
  END IF;
  IF _city IS DISTINCT FROM _job.city THEN
    _changed := array_append(_changed, 'city');
    _diff := _diff || jsonb_build_object('city', jsonb_build_object('old', _job.city, 'new', _city));
  END IF;
  IF _salary_min IS DISTINCT FROM _job.salary_min OR _salary_max IS DISTINCT FROM _job.salary_max
     OR _currency IS DISTINCT FROM _job.currency THEN
    _changed := array_append(_changed, 'salary');
    _diff := _diff || jsonb_build_object('salary', jsonb_build_object(
      'old', jsonb_build_object('min', _job.salary_min, 'max', _job.salary_max, 'currency', _job.currency),
      'new', jsonb_build_object('min', _salary_min, 'max', _salary_max, 'currency', _currency)));
  END IF;
  IF _min_experience IS DISTINCT FROM _job.min_experience THEN
    _changed := array_append(_changed, 'min_experience');
    _diff := _diff || jsonb_build_object('min_experience', jsonb_build_object('old', _job.min_experience, 'new', _min_experience));
  END IF;
  IF COALESCE(btrim(_required_license),'') IS DISTINCT FROM COALESCE(_job.required_license,'') THEN
    _changed := array_append(_changed, 'required_license');
  END IF;
  IF _vacancies IS DISTINCT FROM _job.vacancies THEN
    _changed := array_append(_changed, 'vacancies');
    _diff := _diff || jsonb_build_object('vacancies', jsonb_build_object('old', _job.vacancies, 'new', _vacancies));
  END IF;
  IF _expires_at IS DISTINCT FROM _job.expires_at THEN
    _changed := array_append(_changed, 'expires_at');
    _diff := _diff || jsonb_build_object('expires_at', jsonb_build_object('old', _job.expires_at, 'new', _expires_at));
  END IF;

  IF array_length(_changed, 1) IS NULL THEN
    RETURN _job_id;
  END IF;

  UPDATE public.jobs SET
    title = btrim(_title),
    description = btrim(_description),
    specialty_id = _specialty_id,
    employment_type = _employment_type,
    country = _country,
    city = _city,
    salary_min = _salary_min,
    salary_max = _salary_max,
    currency = _currency,
    min_experience = _min_experience,
    required_license = NULLIF(btrim(COALESCE(_required_license,'')), ''),
    vacancies = _vacancies,
    expires_at = _expires_at,
    updated_at = now()
  WHERE id = _job_id;

  IF _apps > 0 THEN
    FOR _rec IN
      SELECT DISTINCT a.user_id FROM public.applications a
      WHERE a.job_id = _job_id AND a.status <> 'withdrawn'
    LOOP
      PERFORM public.push_notification(
        _rec.user_id, 'job_updated',
        'تم تحديث تفاصيل وظيفة تقدمت لها', 'A job you applied to was updated',
        btrim(_title), btrim(_title), '/activity?tab=applications');
      _notified := _notified + 1;
    END LOOP;
  END IF;

  INSERT INTO public.job_change_events (job_id, changed_by, changed_fields, diff, applicants_notified)
  VALUES (_job_id, _uid, _changed, _diff, _notified);

  RETURN _job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_job_listing(uuid, text, text, uuid, public.employment_type, text, text, numeric, numeric, text, integer, text, integer, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_job_listing(uuid, text, text, uuid, public.employment_type, text, text, numeric, numeric, text, integer, text, integer, timestamptz) TO authenticated, service_role;