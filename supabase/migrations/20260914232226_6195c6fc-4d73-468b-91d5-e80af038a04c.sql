ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
ALTER FUNCTION public.can_view_facility_identity(uuid, uuid) SECURITY INVOKER;