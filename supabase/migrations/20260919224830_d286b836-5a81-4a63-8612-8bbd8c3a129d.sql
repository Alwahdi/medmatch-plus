-- Phase37: subscription_plans no longer public-readable
DROP POLICY IF EXISTS "plans public read" ON public.subscription_plans;
DROP POLICY IF EXISTS "plans authenticated read" ON public.subscription_plans;
CREATE POLICY "plans authenticated read" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.subscription_plans FROM anon;
GRANT SELECT ON public.subscription_plans TO authenticated;