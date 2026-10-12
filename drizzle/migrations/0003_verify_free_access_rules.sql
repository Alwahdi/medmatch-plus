-- Keep internal helpers private; diagnostics execute under migration ownership.
REVOKE EXECUTE ON FUNCTION private.subscription_is_live(text, timestamptz) FROM service_role;
DO $$
BEGIN
  IF NOT private.subscription_is_live('trialing', '2026-09-01'::timestamptz + interval '30 days') THEN
    RAISE EXCEPTION 'REGRESSION: legacy free facility access must continue beyond 30 days';
  END IF;
  IF NOT private.subscription_is_live('active', now() - interval '31 days') THEN
    RAISE EXCEPTION 'REGRESSION: active free access must not expire';
  END IF;
  IF private.subscription_is_live('cancelled', now() + interval '31 days') THEN
    RAISE EXCEPTION 'REGRESSION: inactive facility access must remain blocked';
  END IF;
  IF private.subscription_is_live(NULL, NULL) THEN
    RAISE EXCEPTION 'REGRESSION: missing facility access must remain blocked';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE code='trial' AND active_jobs=5 AND active_shifts=5 AND candidate_searches=25 AND price_monthly=0 AND price_yearly=0) THEN
    RAISE EXCEPTION 'REGRESSION: free access must preserve existing default usage limits';
  END IF;
END $$;