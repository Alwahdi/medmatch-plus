CREATE OR REPLACE FUNCTION public.respond_to_invitation(_invitation_id uuid, _accept boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inv public.invitations;
  v_status public.invitation_status;
BEGIN
  PERFORM public.require_mfa();
  SELECT * INTO v_inv FROM public.invitations WHERE id = _invitation_id FOR UPDATE;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'INVITATION_NOT_FOUND'; END IF;
  IF v_inv.professional_user_id <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF v_inv.status <> 'pending' THEN RAISE EXCEPTION 'INVITATION_NOT_PENDING'; END IF;
  v_status := CASE WHEN _accept THEN 'accepted'::public.invitation_status ELSE 'declined'::public.invitation_status END;
  UPDATE public.invitations SET status = v_status, responded_at = now() WHERE id = _invitation_id;
  RETURN v_status::text;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_to_invitation(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_invitation(uuid, boolean) TO authenticated;