GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;