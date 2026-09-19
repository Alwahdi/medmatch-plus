-- Phase 49 — signup data continuity (idempotent)
-- raw_user_meta_data is user-controlled: onboarding/profile input only, never authorization.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
  _phone_raw text;
  _phone text;
BEGIN
  _name := btrim(COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  IF length(_name) > 100 THEN _name := left(_name, 100); END IF;

  _phone_raw := btrim(COALESCE(NEW.raw_user_meta_data->>'phone', ''));
  -- keep digits and a single leading +, then accept only plausible international numbers
  _phone := regexp_replace(_phone_raw, '[^0-9+]', '', 'g');
  _phone := regexp_replace(_phone, '(?<=.)\+', '', 'g');
  IF _phone !~ '^\+?[0-9]{7,15}$' THEN
    _phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, _name, _phone)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
