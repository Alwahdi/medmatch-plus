REVOKE INSERT ON public.invitations FROM authenticated;
GRANT INSERT (facility_id, professional_user_id, job_id, shift_id, message) ON public.invitations TO authenticated;