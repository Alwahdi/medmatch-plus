REVOKE ALL ON FUNCTION public.start_facility_trial() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_listing_verified() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_job_applications() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_shift_bookings() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;