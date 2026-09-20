DO $$
BEGIN
  IF to_regclass('public.trusted_devices') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.trusted_devices';
    EXECUTE 'DROP POLICY IF EXISTS "own trusted devices" ON public.trusted_devices';
    EXECUTE 'DROP POLICY IF EXISTS "mfa level required" ON public.trusted_devices';
    EXECUTE 'REVOKE ALL ON public.trusted_devices FROM anon';
    EXECUTE 'REVOKE ALL ON public.trusted_devices FROM authenticated';
    EXECUTE 'ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT ALL ON public.trusted_devices TO service_role';
  END IF;
END
$$;