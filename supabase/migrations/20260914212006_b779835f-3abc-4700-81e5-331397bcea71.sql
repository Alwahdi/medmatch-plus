DROP TRIGGER IF EXISTS notify_new_message_trigger ON public.messages;
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
DROP TRIGGER IF EXISTS notify_new_message ON public.messages;
DELETE FROM public.notifications WHERE type = 'message';