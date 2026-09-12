CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _limit integer; _used integer; _ends timestamptz;
BEGIN
  SELECT p.active_jobs, p.active_shifts, s.ends_at
    INTO _limit, _used, _ends
  FROM public.facility_subscriptions s
  JOIN public.subscription_plans p ON p.code = s.plan_code
  WHERE s.facility_id = NEW.facility_id
  LIMIT 1;

  IF _ends IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION';
  END IF;
  IF _ends <= now() THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED';
  END IF;

  IF TG_TABLE_NAME = 'jobs' THEN
    SELECT p.active_jobs INTO _limit
    FROM public.facility_subscriptions s JOIN public.subscription_plans p ON p.code = s.plan_code
    WHERE s.facility_id = NEW.facility_id LIMIT 1;
    SELECT count(*) INTO _used FROM public.jobs j WHERE j.facility_id = NEW.facility_id AND j.is_active;
    IF _limit >= 0 AND _used >= _limit THEN
      RAISE EXCEPTION 'JOB_QUOTA_EXCEEDED';
    END IF;
  ELSE
    SELECT p.active_shifts INTO _limit
    FROM public.facility_subscriptions s JOIN public.subscription_plans p ON p.code = s.plan_code
    WHERE s.facility_id = NEW.facility_id LIMIT 1;
    SELECT count(*) INTO _used FROM public.shifts sh WHERE sh.facility_id = NEW.facility_id AND sh.status = 'open';
    IF _limit >= 0 AND _used >= _limit THEN
      RAISE EXCEPTION 'SHIFT_QUOTA_EXCEEDED';
    END IF;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER jobs_enforce_limits BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

CREATE TRIGGER shifts_enforce_limits BEFORE INSERT ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

REVOKE EXECUTE ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;