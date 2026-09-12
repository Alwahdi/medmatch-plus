REVOKE ALL ON FUNCTION public.bump_conversation_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_conversation_activity() TO service_role;