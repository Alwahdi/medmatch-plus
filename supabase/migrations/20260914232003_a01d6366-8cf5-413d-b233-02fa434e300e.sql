GRANT EXECUTE ON FUNCTION public.can_view_facility_identity(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_engagement(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;