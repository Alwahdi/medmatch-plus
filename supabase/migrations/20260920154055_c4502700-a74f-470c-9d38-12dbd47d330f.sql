-- Phase 77: single source of truth for subscription lifecycle eligibility.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- The one lifecycle predicate reused by posting, search and quota consumption.
CREATE OR REPLACE FUNCTION private.subscription_is_live(_status text, _ends timestamptz)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT _status IN ('active', 'trialing') AND _ends IS NOT NULL AND _ends > now();
$$;
REVOKE ALL ON FUNCTION private.subscription_is_live(text, timestamptz) FROM PUBLIC, anon, authenticated;

-- Plan/quota snapshot, returned only while the subscription is live.
CREATE OR REPLACE FUNCTION private.facility_subscription_access(_facility_id uuid)
RETURNS TABLE (
  status text,
  plan_code text,
  active_jobs integer,
  active_shifts integer,
  candidate_searches integer,
  searches_used integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.status, s.plan_code, p.active_jobs, p.active_shifts,
         p.candidate_searches, s.searches_used
  FROM public.facility_subscriptions s
  JOIN public.subscription_plans p ON p.code = s.plan_code
  WHERE s.facility_id = _facility_id
    AND private.subscription_is_live(s.status, s.ends_at)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION private.facility_subscription_access(uuid) FROM PUBLIC, anon, authenticated;

-- Posting limits: lifecycle-aware and safe under concurrent inserts.
CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limit integer;
  _used integer;
  _status text;
  _ends timestamptz;
  _acc record;
BEGIN
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
    SELECT count(*) INTO _used FROM public.jobs j
    WHERE j.facility_id = NEW.facility_id AND j.is_active;
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
$$;
REVOKE ALL ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;

-- Legacy quota consumer: same lifecycle rule as everything else.
CREATE OR REPLACE FUNCTION public.consume_candidate_search()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _facility uuid; _left integer;
BEGIN
  PERFORM public.require_mfa();
  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;
  UPDATE public.facility_subscriptions s
    SET searches_used = s.searches_used + 1, updated_at = now()
  WHERE s.facility_id = _facility
    AND private.subscription_is_live(s.status, s.ends_at);
  IF NOT FOUND THEN RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION'; END IF;
  SELECT GREATEST(a.candidate_searches - a.searches_used, 0) INTO _left
  FROM private.facility_subscription_access(_facility) a;
  RETURN COALESCE(_left, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_candidate_search() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_candidate_search() TO service_role;

-- Known lifecycle values only; counters cannot go negative.
ALTER TABLE public.facility_subscriptions
  DROP CONSTRAINT IF EXISTS facility_subscriptions_status_known;
ALTER TABLE public.facility_subscriptions
  ADD CONSTRAINT facility_subscriptions_status_known
  CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired'))
  NOT VALID;
ALTER TABLE public.facility_subscriptions VALIDATE CONSTRAINT facility_subscriptions_status_known;

ALTER TABLE public.facility_subscriptions
  DROP CONSTRAINT IF EXISTS facility_subscriptions_billing_period_known;
ALTER TABLE public.facility_subscriptions
  ADD CONSTRAINT facility_subscriptions_billing_period_known
  CHECK (billing_period IN ('monthly', 'yearly'))
  NOT VALID;
ALTER TABLE public.facility_subscriptions VALIDATE CONSTRAINT facility_subscriptions_billing_period_known;

ALTER TABLE public.facility_subscriptions
  DROP CONSTRAINT IF EXISTS facility_subscriptions_searches_used_nonneg;
ALTER TABLE public.facility_subscriptions
  ADD CONSTRAINT facility_subscriptions_searches_used_nonneg
  CHECK (searches_used >= 0)
  NOT VALID;
ALTER TABLE public.facility_subscriptions VALIDATE CONSTRAINT facility_subscriptions_searches_used_nonneg;

-- Explicit privileges (Phase 60 rule): clients read own rows only, never write.
REVOKE ALL ON public.facility_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.facility_subscriptions TO authenticated;
GRANT ALL ON public.facility_subscriptions TO service_role;
ALTER TABLE public.facility_subscriptions ENABLE ROW LEVEL SECURITY;