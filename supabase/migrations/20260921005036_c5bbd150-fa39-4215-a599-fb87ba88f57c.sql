CREATE OR REPLACE FUNCTION public.notify_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _fac_user uuid;
BEGIN
  IF NEW.direction = 'pro_to_facility' THEN
    SELECT user_id INTO _fac_user FROM public.facilities WHERE id = NEW.facility_id;
    PERFORM public.push_notification(_fac_user, 'review', 'تقييم جديد لمنشأتك', 'New review for your facility',
      NULL, NULL, '/facilities/' || NEW.facility_id::text);
  ELSE
    PERFORM public.push_notification(NEW.professional_user_id, 'review', 'تقييم جديد لملفك', 'New review on your profile',
      NULL, NULL, '/profile');
  END IF;
  RETURN NEW;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.notify_review() FROM PUBLIC, anon, authenticated;
