CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _role text;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;

  _role := NEW.raw_user_meta_data->>'role';
  IF _role IN ('professional','facility') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_professional_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE has_pro boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.healthcare_professionals WHERE user_id = auth.uid()) INTO has_pro;
  IF NOT has_pro THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'professional')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END; $$;