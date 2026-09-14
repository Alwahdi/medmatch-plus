REVOKE EXECUTE ON FUNCTION public.admin_data_integrity_report() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_data_integrity_report() TO service_role;