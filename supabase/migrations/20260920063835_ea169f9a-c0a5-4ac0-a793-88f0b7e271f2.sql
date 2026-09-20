-- Phase 55 — نوع حساب واحد لكل مستخدم (idempotent، مطابق للـhotfix الحي)

CREATE OR REPLACE FUNCTION public.guard_single_account_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
BEGIN
  IF TG_TABLE_NAME = 'healthcare_professionals' THEN
    v_user := NEW.user_id;
    IF v_user IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.facilities f WHERE f.user_id = v_user
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_TYPE_CONFLICT';
    END IF;
  ELSIF TG_TABLE_NAME = 'facilities' THEN
    v_user := NEW.user_id;
    -- Seed/public facilities may intentionally have no owning auth user.
    IF v_user IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.healthcare_professionals hp WHERE hp.user_id = v_user
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_TYPE_CONFLICT';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_single_account_type() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_single_type_professional ON public.healthcare_professionals;
CREATE TRIGGER trg_single_type_professional
  BEFORE INSERT OR UPDATE OF user_id ON public.healthcare_professionals
  FOR EACH ROW EXECUTE FUNCTION public.guard_single_account_type();

DROP TRIGGER IF EXISTS trg_single_type_facility ON public.facilities;
CREATE TRIGGER trg_single_type_facility
  BEFORE INSERT OR UPDATE OF user_id ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.guard_single_account_type();

CREATE OR REPLACE FUNCTION public.claim_professional_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  IF EXISTS (SELECT 1 FROM public.facilities f WHERE f.user_id = auth.uid())
     OR EXISTS (
       SELECT 1 FROM public.user_roles r
       WHERE r.user_id = auth.uid() AND r.role = 'facility'::public.app_role
     ) THEN
    RAISE EXCEPTION 'ACCOUNT_TYPE_CONFLICT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.healthcare_professionals hp
    WHERE hp.user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'professional')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_facility_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  IF EXISTS (
       SELECT 1 FROM public.healthcare_professionals hp
       WHERE hp.user_id = auth.uid()
     )
     OR EXISTS (
       SELECT 1 FROM public.user_roles r
       WHERE r.user_id = auth.uid() AND r.role = 'professional'::public.app_role
     ) THEN
    RAISE EXCEPTION 'ACCOUNT_TYPE_CONFLICT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'facility')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_professional_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_facility_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_professional_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_facility_role() TO authenticated, service_role;