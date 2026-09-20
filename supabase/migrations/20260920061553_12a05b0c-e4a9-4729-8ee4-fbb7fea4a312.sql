CREATE OR REPLACE FUNCTION public.mfa_access_ok()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE _enrolled boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  -- المنتج يدعم TOTP فقط؛ أي نوع آخر لا يُفرض حتى يُدعم تحدّيه في الواجهة.
  SELECT EXISTS (
    SELECT 1 FROM auth.mfa_factors f
    WHERE f.user_id = auth.uid()
      AND f.status = 'verified'
      AND f.factor_type = 'totp'
  ) INTO _enrolled;
  IF NOT _enrolled THEN RETURN true; END IF;
  RETURN COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
END;
$function$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_policies
    WHERE schemaname = 'public' AND policyname = 'mfa level required'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'mfa level required', r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((select public.mfa_access_ok())) WITH CHECK ((select public.mfa_access_ok()))',
      'mfa level required', r.tablename);
  END LOOP;
END $$;