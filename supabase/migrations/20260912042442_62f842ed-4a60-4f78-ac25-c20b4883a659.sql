ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

ALTER TABLE public.messages ALTER COLUMN body SET DEFAULT '';

CREATE POLICY "chat attachments read participants" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "chat attachments insert participants" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "chat attachments delete owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments' AND owner = auth.uid());