-- Phase 31: invitations must be created only through send_candidate_invitation.
REVOKE INSERT ON public.invitations FROM authenticated;
REVOKE INSERT ON public.invitations FROM anon;

-- Keep the intended narrow surface (idempotent re-assert).
GRANT SELECT, DELETE ON public.invitations TO authenticated;
GRANT UPDATE (status) ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;