CREATE OR REPLACE FUNCTION public.is_allowed_upload(_bucket text, _name text, _metadata jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, storage
AS $$
DECLARE
  v_ext text := lower(coalesce(storage.extension(_name), ''));
  v_mime text := lower(split_part(coalesce(_metadata->>'mimetype', ''), ';', 1));
  v_exts text[];
  v_mimes text[];
BEGIN
  IF _bucket = 'avatars' THEN
    v_exts := array['jpg','jpeg','png','webp','gif'];
    v_mimes := array['image/jpeg','image/png','image/webp','image/gif'];
  ELSIF _bucket IN ('credentials','facility-docs') THEN
    v_exts := array['pdf','jpg','jpeg','png','webp'];
    v_mimes := array['application/pdf','image/jpeg','image/png','image/webp'];
  ELSIF _bucket = 'chat-attachments' THEN
    v_exts := array['pdf','jpg','jpeg','png','webp','gif','mp4','webm','mov','ogg','oga','m4a','mp3','wav','txt','csv','doc','docx','xls','xlsx'];
    v_mimes := array['application/pdf','image/jpeg','image/png','image/webp','image/gif',
                     'video/mp4','video/webm','video/quicktime',
                     'audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/x-m4a','audio/aac',
                     'text/plain','text/csv','application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                     'application/vnd.ms-excel',
                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  ELSE
    RETURN false;
  END IF;

  IF NOT (v_ext = ANY(v_exts)) THEN
    RETURN false;
  END IF;
  -- mimetype is validated whenever storage reports it
  IF v_mime <> '' AND NOT (v_mime = ANY(v_mimes)) THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.is_allowed_upload(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_allowed_upload(text, text, jsonb) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "avatars insert own" ON storage.objects;
CREATE POLICY "avatars insert own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.is_allowed_upload('avatars', name, metadata)
);

DROP POLICY IF EXISTS "avatars update own" ON storage.objects;
CREATE POLICY "avatars update own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.is_allowed_upload('avatars', name, metadata)
);

DROP POLICY IF EXISTS "credentials own insert" ON storage.objects;
CREATE POLICY "credentials own insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'credentials'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.is_allowed_upload('credentials', name, metadata)
);

DROP POLICY IF EXISTS "credentials own update" ON storage.objects;
CREATE POLICY "credentials own update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'credentials' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (
  bucket_id = 'credentials'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.is_allowed_upload('credentials', name, metadata)
);

DROP POLICY IF EXISTS "Facility owners upload facility docs" ON storage.objects;
CREATE POLICY "Facility owners upload facility docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'facility-docs'
  AND EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.user_id = auth.uid() AND f.id::text = (storage.foldername(name))[1]
  )
  AND public.is_allowed_upload('facility-docs', name, metadata)
);

DROP POLICY IF EXISTS "chat attachments insert participants" ON storage.objects;
CREATE POLICY "chat attachments insert participants" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  AND public.is_allowed_upload('chat-attachments', name, metadata)
);