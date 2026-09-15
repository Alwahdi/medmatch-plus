REVOKE ALL ON FUNCTION public.set_application_stage(uuid, application_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hire_applicant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unhire_applicant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_application_stage(uuid, application_status) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hire_applicant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unhire_applicant(uuid) TO authenticated, service_role;