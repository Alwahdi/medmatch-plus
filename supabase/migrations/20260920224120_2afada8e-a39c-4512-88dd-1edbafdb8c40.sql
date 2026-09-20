ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.facility_documents ADD COLUMN IF NOT EXISTS file_name text;

CREATE OR REPLACE FUNCTION public.is_allowed_upload(_bucket text, _name text, _metadata jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'storage'
AS $function$
DECLARE
  v_ext text := lower(coalesce(storage.extension(_name), ''));
  v_mime text := lower(split_part(coalesce(_metadata->>'mimetype', ''), ';', 1));
  v_exts text[];
  v_mimes text[];
BEGIN
  IF _bucket = 'avatars' THEN
    v_exts := array['jpg','jpeg','png','webp','gif','heic','heif'];
    v_mimes := array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif'];
  ELSIF _bucket IN ('credentials','facility-docs') THEN
    v_exts := array['pdf','jpg','jpeg','png','webp','heic','heif'];
    v_mimes := array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif'];
  ELSIF _bucket = 'chat-attachments' THEN
    v_exts := array['pdf','jpg','jpeg','png','webp','gif','heic','heif','mp4','webm','mov','ogg','oga','m4a','mp3','wav','txt','csv','doc','docx','xls','xlsx'];
    v_mimes := array['application/pdf','image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
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
  IF v_mime <> '' AND NOT (v_mime = ANY(v_mimes)) THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.is_allowed_upload(text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_allowed_upload(text, text, jsonb) TO authenticated, service_role;