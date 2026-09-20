CREATE OR REPLACE FUNCTION public.guard_public_listing_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _text text;
  _norm text;
  _digits text;
  _name_ar text;
  _name_en text;
  _site text;
  _host text;
BEGIN
  IF TG_TABLE_NAME = 'jobs' THEN
    _text := COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '');
  ELSE
    _text := COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.notes, '');
  END IF;

  _norm := lower(btrim(regexp_replace(_text, '\s+', ' ', 'g')));
  IF _norm = '' THEN RETURN NEW; END IF;

  -- روابط صريحة
  IF _norm ~ '(https?://|www\.)' THEN
    RAISE EXCEPTION 'LISTING_IDENTITY_DISCLOSURE';
  END IF;

  -- بريد إلكتروني
  IF _norm ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' THEN
    RAISE EXCEPTION 'LISTING_IDENTITY_DISCLOSURE';
  END IF;

  -- أرقام تواصل: تُزال الفواصل الشائعة ثم يُبحث عن سلسلة أرقام طويلة (9+)
  -- حتى لا تُرفض السنوات أو قيم الرواتب العادية.
  _digits := regexp_replace(_norm, '[ \-().‏‎]', '', 'g');
  IF _digits ~ '[0-9]{9,}' OR _digits ~ '\+[0-9]{6,}' THEN
    RAISE EXCEPTION 'LISTING_IDENTITY_DISCLOSURE';
  END IF;

  -- كلمة تواصل صريحة مع رقم قصير (7+)
  IF _norm ~ '(whatsapp|whats app|واتس|واتساب|تلجرام|telegram)' AND _digits ~ '[0-9]{7,}' THEN
    RAISE EXCEPTION 'LISTING_IDENTITY_DISCLOSURE';
  END IF;

  SELECT lower(btrim(regexp_replace(COALESCE(f.name_ar, ''), '\s+', ' ', 'g'))),
         lower(btrim(regexp_replace(COALESCE(f.name_en, ''), '\s+', ' ', 'g'))),
         COALESCE(f.website, '')
    INTO _name_ar, _name_en, _site
    FROM public.facilities f
   WHERE f.id = NEW.facility_id;

  IF _name_ar IS NOT NULL AND char_length(_name_ar) >= 3 AND position(_name_ar IN _norm) > 0 THEN
    RAISE EXCEPTION 'LISTING_IDENTITY_DISCLOSURE';
  END IF;
  IF _name_en IS NOT NULL AND char_length(_name_en) >= 3 AND position(_name_en IN _norm) > 0 THEN
    RAISE EXCEPTION 'LISTING_IDENTITY_DISCLOSURE';
  END IF;

  IF _site <> '' THEN
    _host := lower(split_part(regexp_replace(_site, '^https?://', '', 'i'), '/', 1));
    _host := regexp_replace(_host, '^www\.', '');
    IF char_length(_host) >= 4 AND position(_host IN _norm) > 0 THEN
      RAISE EXCEPTION 'LISTING_IDENTITY_DISCLOSURE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_public_listing_identity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_job_identity ON public.jobs;
CREATE TRIGGER guard_job_identity
  BEFORE INSERT OR UPDATE OF title, description ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.guard_public_listing_identity();

DROP TRIGGER IF EXISTS guard_shift_identity ON public.shifts;
CREATE TRIGGER guard_shift_identity
  BEFORE INSERT OR UPDATE OF title, notes ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.guard_public_listing_identity();