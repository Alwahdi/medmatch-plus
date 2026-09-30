CREATE OR REPLACE FUNCTION public.lock_established_account_location()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  -- The server-only deletion finalizer must be able to clear a former member's location.
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NULLIF(btrim(COALESCE(OLD.country, '')), '') IS NOT NULL
     AND NEW.country IS DISTINCT FROM OLD.country THEN
    RAISE EXCEPTION 'LOCATION_CHANGE_REQUIRES_APPROVAL';
  END IF;
  IF NULLIF(btrim(COALESCE(OLD.city, '')), '') IS NOT NULL
     AND NEW.city IS DISTINCT FROM OLD.city THEN
    RAISE EXCEPTION 'LOCATION_CHANGE_REQUIRES_APPROVAL';
  END IF;
  RETURN NEW;
END;
$fn$;