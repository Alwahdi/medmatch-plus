-- Phase 99: consistent job expiry semantics

CREATE OR REPLACE FUNCTION public.job_accepting_applications(_is_active boolean, _expires_at timestamptz)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(_is_active, false) AND (_expires_at IS NULL OR _expires_at > now());
$$;

REVOKE ALL ON FUNCTION public.job_accepting_applications(boolean, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_accepting_applications(boolean, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _limit integer;
  _used integer;
  _status text;
  _ends timestamptz;
  _acc record;
BEGIN
  -- On UPDATE only re-check when the listing newly starts accepting applications
  -- (republish, or extending an expired deadline into the future).
  IF TG_OP = 'UPDATE' THEN
    IF NOT public.job_accepting_applications(NEW.is_active, NEW.expires_at)
       OR public.job_accepting_applications(OLD.is_active, OLD.expires_at) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Serialize quota checks per facility so two concurrent inserts cannot both pass.
  PERFORM pg_advisory_xact_lock(hashtextextended('facility_plan_limit:' || NEW.facility_id::text, 0));

  SELECT s.status, s.ends_at INTO _status, _ends
  FROM public.facility_subscriptions s
  WHERE s.facility_id = NEW.facility_id
  FOR UPDATE;

  IF _status IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION';
  END IF;
  IF _status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'SUBSCRIPTION_INACTIVE';
  END IF;
  IF _ends IS NULL OR _ends <= now() THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED';
  END IF;

  SELECT * INTO _acc FROM private.facility_subscription_access(NEW.facility_id);
  IF _acc IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION';
  END IF;

  IF TG_TABLE_NAME = 'jobs' THEN
    _limit := _acc.active_jobs;
    -- Expired listings no longer consume posting quota.
    SELECT count(*) INTO _used FROM public.jobs j
    WHERE j.facility_id = NEW.facility_id
      AND j.id IS DISTINCT FROM NEW.id
      AND public.job_accepting_applications(j.is_active, j.expires_at);
    IF _limit >= 0 AND _used >= _limit THEN
      RAISE EXCEPTION 'JOB_QUOTA_EXCEEDED';
    END IF;
  ELSE
    _limit := _acc.active_shifts;
    SELECT count(*) INTO _used FROM public.shifts sh
    WHERE sh.facility_id = NEW.facility_id AND sh.status = 'open';
    IF _limit >= 0 AND _used >= _limit THEN
      RAISE EXCEPTION 'SHIFT_QUOTA_EXCEEDED';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS jobs_enforce_limits_on_reopen ON public.jobs;
CREATE TRIGGER jobs_enforce_limits_on_reopen
  BEFORE UPDATE OF is_active, expires_at ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

REVOKE ALL ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_plan_limits() TO service_role;

-- Reuse the shared rule in the trusted paths (public view keeps the inline
-- expression so anon never needs EXECUTE on a helper function).
CREATE OR REPLACE FUNCTION private.invitation_target_available(_facility_id uuid, _job_id uuid, _shift_id uuid, _lock boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  _ok boolean;
BEGIN
  IF _job_id IS NULL AND _shift_id IS NULL THEN
    RETURN true;
  END IF;

  IF _job_id IS NOT NULL THEN
    IF _lock THEN
      PERFORM 1 FROM public.jobs j WHERE j.id = _job_id FOR UPDATE;
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = _job_id
        AND j.facility_id = _facility_id
        AND public.job_accepting_applications(j.is_active, j.expires_at)
    ) INTO _ok;
    RETURN _ok;
  END IF;

  IF _lock THEN
    PERFORM 1 FROM public.shifts s WHERE s.id = _shift_id FOR UPDATE;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = _shift_id
      AND s.facility_id = _facility_id
      AND s.status = 'open'::public.shift_status
      AND s.starts_at > now()
  ) INTO _ok;
  RETURN _ok;
END;
$function$;