CREATE OR REPLACE FUNCTION public.sync_pro_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid; _approved_required int;
BEGIN
  _uid := COALESCE(NEW.user_id, OLD.user_id);
  SELECT count(DISTINCT c.doc_type) INTO _approved_required
  FROM public.credentials c
  WHERE c.user_id = _uid
    AND c.status = 'approved'
    AND c.doc_type IN ('ترخيص مزاولة المهنة', 'بطاقة الهوية / الجواز');
  UPDATE public.healthcare_professionals
  SET is_verified = (_approved_required >= 2)
  WHERE user_id = _uid;
  RETURN NULL;
END; $function$;