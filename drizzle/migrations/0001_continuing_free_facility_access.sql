-- Legacy subscription rows now represent continuing free access. No quota, RLS,
-- verification or ownership rule is relaxed; inactive states remain blocked.
CREATE OR REPLACE FUNCTION private.subscription_is_live(_status text, _ends timestamptz)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT COALESCE(_status IN ('active', 'trialing'), false); $$;
REVOKE ALL ON FUNCTION private.subscription_is_live(text, timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_facility_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.facility_subscriptions (facility_id, plan_code, status, ends_at)
  VALUES (NEW.id, 'trial', 'trialing', 'infinity'::timestamptz)
  ON CONFLICT (facility_id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.start_facility_trial() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_facility_trial() TO service_role;
ALTER TABLE public.facility_subscriptions ALTER COLUMN ends_at SET DEFAULT 'infinity'::timestamptz;
COMMENT ON COLUMN public.facility_subscriptions.ends_at IS 'Legacy date retained for compatibility; not an expiry or payment renewal for current free access.';

CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _limit integer;
  _used integer;
  _status text;
  _ends timestamptz;
  _acc record;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NOT public.job_accepting_applications(NEW.is_active, NEW.expires_at)
       OR public.job_accepting_applications(OLD.is_active, OLD.expires_at) THEN
      RETURN NEW;
    END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('facility_plan_limit:' || NEW.facility_id::text, 0));
  SELECT s.status, s.ends_at INTO _status, _ends
  FROM public.facility_subscriptions s WHERE s.facility_id = NEW.facility_id FOR UPDATE;
  IF _status IS NULL THEN RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION'; END IF;
  IF NOT private.subscription_is_live(_status, _ends) THEN RAISE EXCEPTION 'SUBSCRIPTION_INACTIVE'; END IF;
  SELECT * INTO _acc FROM private.facility_subscription_access(NEW.facility_id);
  IF _acc IS NULL THEN RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION'; END IF;
  IF TG_TABLE_NAME = 'jobs' THEN
    _limit := _acc.active_jobs;
    SELECT count(*) INTO _used FROM public.jobs j
    WHERE j.facility_id = NEW.facility_id AND j.id IS DISTINCT FROM NEW.id
      AND public.job_accepting_applications(j.is_active, j.expires_at);
    IF _limit >= 0 AND _used >= _limit THEN RAISE EXCEPTION 'JOB_QUOTA_EXCEEDED'; END IF;
  ELSE
    _limit := _acc.active_shifts;
    SELECT count(*) INTO _used FROM public.shifts sh
    WHERE sh.facility_id = NEW.facility_id AND sh.status = 'open';
    IF _limit >= 0 AND _used >= _limit THEN RAISE EXCEPTION 'SHIFT_QUOTA_EXCEEDED'; END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_plan_limits() TO service_role;
