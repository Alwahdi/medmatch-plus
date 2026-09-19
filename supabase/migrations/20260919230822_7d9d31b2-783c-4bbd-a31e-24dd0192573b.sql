CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_events_user_feature_time_idx
  ON public.ai_usage_events (user_id, feature, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_usage_events FROM PUBLIC;
REVOKE ALL ON public.ai_usage_events FROM anon;
REVOKE ALL ON public.ai_usage_events FROM authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(_feature text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _hour_limit integer := 5;   -- الحد بالساعة لكل مستخدم
  _day_limit integer := 20;   -- الحد اليومي لكل مستخدم
  _hour_count integer;
  _day_count integer;
  _retry integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  IF _feature IS NULL OR _feature NOT IN ('cv_parse') THEN
    RAISE EXCEPTION 'UNKNOWN_AI_FEATURE' USING ERRCODE = '22023';
  END IF;

  -- قفل لكل مستخدم/ميزة حتى يكون الاحتساب ذرّياً أمام الطلبات المتزامنة
  PERFORM pg_advisory_xact_lock(hashtext('ai_quota:' || _feature), hashtext(_uid::text));

  SELECT count(*) INTO _hour_count
  FROM public.ai_usage_events
  WHERE user_id = _uid AND feature = _feature AND created_at > now() - interval '1 hour';

  SELECT count(*) INTO _day_count
  FROM public.ai_usage_events
  WHERE user_id = _uid AND feature = _feature AND created_at > now() - interval '1 day';

  IF _hour_count >= _hour_limit THEN
    SELECT GREATEST(1, ceil(extract(epoch FROM (min(created_at) + interval '1 hour' - now()))))::integer
      INTO _retry
    FROM public.ai_usage_events
    WHERE user_id = _uid AND feature = _feature AND created_at > now() - interval '1 hour';
    RETURN jsonb_build_object('allowed', false, 'scope', 'hour', 'retry_after_seconds', _retry);
  END IF;

  IF _day_count >= _day_limit THEN
    SELECT GREATEST(1, ceil(extract(epoch FROM (min(created_at) + interval '1 day' - now()))))::integer
      INTO _retry
    FROM public.ai_usage_events
    WHERE user_id = _uid AND feature = _feature AND created_at > now() - interval '1 day';
    RETURN jsonb_build_object('allowed', false, 'scope', 'day', 'retry_after_seconds', _retry);
  END IF;

  INSERT INTO public.ai_usage_events (user_id, feature) VALUES (_uid, _feature);

  RETURN jsonb_build_object(
    'allowed', true,
    'scope', 'ok',
    'remaining_hour', _hour_limit - _hour_count - 1,
    'remaining_day', _day_limit - _day_count - 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_quota(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text) TO service_role;