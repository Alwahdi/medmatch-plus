-- Phase 101: message notifications must not duplicate private chat text
CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _recipient uuid; _fac_user uuid; _pro uuid;
BEGIN
  SELECT f.user_id, c.professional_user_id
    INTO _fac_user, _pro
  FROM public.conversations c
  LEFT JOIN public.facilities f ON f.id = c.facility_id
  WHERE c.id = NEW.conversation_id;

  _recipient := CASE WHEN NEW.sender_id = _pro THEN _fac_user ELSE _pro END;
  IF _recipient IS NULL OR _recipient = NEW.sender_id THEN RETURN NEW; END IF;

  -- لا مقتطف من نص الرسالة ولا اسم مرفق ولا موضوع: العنوان العام فقط.
  PERFORM public.push_notification(
    _recipient,
    'message',
    'رسالة جديدة',
    'New message',
    NULL,
    NULL,
    '/messages'
  );
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_message() TO service_role;

-- مسح أي نص محادثة محفوظ في إشعارات الرسائل (idempotent)
UPDATE public.notifications
   SET body_ar = NULL, body_en = NULL
 WHERE type = 'message'
   AND (body_ar IS NOT NULL OR body_en IS NOT NULL);