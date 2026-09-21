DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'applications','jobs','shifts','shift_bookings','invitations','interviews',
    'credentials','facility_documents','reviews','conversations',
    'profile_change_requests','safety_reports','contact_messages',
    'account_deletion_requests','facilities','healthcare_professionals',
    'facility_subscriptions','platform_settings','document_requirements'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;