CREATE OR REPLACE FUNCTION public.validate_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
  ELSE
    IF NEW.attachment_path NOT LIKE NEW.conversation_id::text || '/%' THEN
      RAISE EXCEPTION 'INVALID_ATTACHMENT_PATH';
    END IF;
    IF length(NEW.attachment_path) > 1024 THEN
      RAISE EXCEPTION 'ATTACHMENT_PATH_TOO_LONG';
    END IF;
    IF NEW.attachment_name IS NULL OR btrim(NEW.attachment_name) = ''
       OR length(NEW.attachment_name) > 255 THEN
      RAISE EXCEPTION 'INVALID_ATTACHMENT_NAME';
    END IF;
    IF NEW.attachment_type IS NULL OR btrim(NEW.attachment_type) = ''
       OR length(NEW.attachment_type) > 150 THEN
      RAISE EXCEPTION 'INVALID_ATTACHMENT_TYPE';
    END IF;
    IF NEW.attachment_size IS NULL
       OR NEW.attachment_size <= 0
       OR NEW.attachment_size > 10485760 THEN
      RAISE EXCEPTION 'INVALID_ATTACHMENT_SIZE';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_message_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_message_insert() FROM anon;
REVOKE ALL ON FUNCTION public.validate_message_insert() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_message_insert() TO service_role;

DROP TRIGGER IF EXISTS trg_validate_message_insert ON public.messages;
CREATE TRIGGER trg_validate_message_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_insert();

CREATE OR REPLACE FUNCTION public.validate_message_reaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.emoji := btrim(COALESCE(NEW.emoji, ''));
  IF NEW.emoji = '' OR char_length(NEW.emoji) > 16 THEN
    RAISE EXCEPTION 'INVALID_REACTION';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_message_reaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_message_reaction() FROM anon;
REVOKE ALL ON FUNCTION public.validate_message_reaction() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_message_reaction() TO service_role;

DROP TRIGGER IF EXISTS trg_validate_message_reaction ON public.message_reactions;
CREATE TRIGGER trg_validate_message_reaction
  BEFORE INSERT OR UPDATE OF emoji ON public.message_reactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_reaction();

-- حارس إيصالات التسليم/القراءة من المرحلة 27 يبقى كما هو (BEFORE UPDATE، مستقل عن حارس الإدخال).
DROP TRIGGER IF EXISTS trg_guard_message_receipts ON public.messages;
CREATE TRIGGER trg_guard_message_receipts
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_receipts();