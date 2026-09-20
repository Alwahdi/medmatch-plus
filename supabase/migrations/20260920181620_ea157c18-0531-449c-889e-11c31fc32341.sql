CREATE OR REPLACE FUNCTION public.validate_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  _obj record;
  _mime text;
  _size bigint;
  _base text;
  _name text;
  _path_ext text;
  _name_ext text;
  _trusted boolean := current_user IN ('service_role','postgres','supabase_admin');
BEGIN
  NEW.body := COALESCE(NEW.body, '');

  IF length(NEW.body) > 2000 THEN
    RAISE EXCEPTION 'MESSAGE_TOO_LONG';
  END IF;

  IF NEW.attachment_path IS NULL THEN
    IF btrim(NEW.body) = '' THEN
      RAISE EXCEPTION 'MESSAGE_EMPTY';
    END IF;
    NEW.attachment_name := NULL;
    NEW.attachment_type := NULL;
    NEW.attachment_size := NULL;
    RETURN NEW;
  END IF;

  IF NEW.attachment_path NOT LIKE NEW.conversation_id::text || '/%' THEN
    RAISE EXCEPTION 'INVALID_ATTACHMENT_PATH';
  END IF;
  IF length(NEW.attachment_path) > 1024 THEN
    RAISE EXCEPTION 'ATTACHMENT_PATH_TOO_LONG';
  END IF;

  SELECT o.name AS name, o.owner_id AS owner_id, o.metadata AS metadata INTO _obj
  FROM storage.objects o
  WHERE o.bucket_id = 'chat-attachments' AND o.name = NEW.attachment_path;

  IF _obj.name IS NULL THEN
    RAISE EXCEPTION 'ATTACHMENT_NOT_FOUND';
  END IF;

  IF NOT _trusted AND COALESCE(_obj.owner_id::text, '') IS DISTINCT FROM auth.uid()::text THEN
    RAISE EXCEPTION 'ATTACHMENT_NOT_OWNED';
  END IF;

  IF split_part(_obj.name, '/', 1) IS DISTINCT FROM NEW.conversation_id::text THEN
    RAISE EXCEPTION 'INVALID_ATTACHMENT_PATH';
  END IF;

  _mime := lower(split_part(COALESCE(_obj.metadata->>'mimetype', ''), ';', 1));
  _size := NULLIF(_obj.metadata->>'size', '')::bigint;

  IF _mime = '' OR NOT public.is_allowed_upload('chat-attachments', _obj.name, _obj.metadata) THEN
    RAISE EXCEPTION 'INVALID_ATTACHMENT_TYPE';
  END IF;
  IF _size IS NULL OR _size <= 0 OR _size > 10485760 THEN
    RAISE EXCEPTION 'INVALID_ATTACHMENT_SIZE';
  END IF;

  NEW.attachment_type := _mime;
  NEW.attachment_size := _size;

  _base := regexp_replace(_obj.name, '^.*/', '');
  _name := btrim(COALESCE(NEW.attachment_name, ''));
  _name := replace(replace(replace(_name, E'\n', ' '), E'\r', ' '), '/', '-');
  _name := left(_name, 255);
  _path_ext := lower(storage.extension(_obj.name));
  _name_ext := lower(COALESCE(NULLIF(regexp_replace(_name, '^.*\.', ''), _name), ''));
  IF _name = '' OR _name_ext IS DISTINCT FROM _path_ext THEN
    _name := left(_base, 255);
  END IF;
  NEW.attachment_name := _name;

  RETURN NEW;
END;
$$;

-- legacy voice notes: align stored MIME with Storage's canonical value (receipt guard is for client updates)
ALTER TABLE public.messages DISABLE TRIGGER trg_guard_message_receipts;
UPDATE public.messages m
SET attachment_type = lower(split_part(o.metadata->>'mimetype', ';', 1))
FROM storage.objects o
WHERE o.bucket_id = 'chat-attachments'
  AND o.name = m.attachment_path
  AND m.attachment_type IS DISTINCT FROM lower(split_part(o.metadata->>'mimetype', ';', 1))
  AND lower(split_part(m.attachment_type, ';', 1)) = lower(split_part(o.metadata->>'mimetype', ';', 1));
ALTER TABLE public.messages ENABLE TRIGGER trg_guard_message_receipts;

CREATE OR REPLACE FUNCTION public.admin_chat_attachment_orphans()
RETURNS TABLE (name text, size bigint, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  RETURN QUERY
  SELECT o.name,
         NULLIF(o.metadata->>'size','')::bigint,
         o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'chat-attachments'
    AND o.created_at < now() - interval '24 hours'
    AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.attachment_path = o.name)
  ORDER BY o.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_chat_attachment_orphans() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_chat_attachment_orphans() TO authenticated, service_role;