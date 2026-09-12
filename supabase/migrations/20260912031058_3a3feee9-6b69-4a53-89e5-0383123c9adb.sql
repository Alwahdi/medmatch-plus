CREATE OR REPLACE FUNCTION public.set_job_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(regexp_replace(trim(NEW.title), '[^[:alnum:]\u0600-\u06FF]+', '-', 'g'));
    base := trim(both '-' from base);
    IF base = '' THEN base := 'job'; END IF;
    NEW.slug := base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_set_slug ON public.jobs;
CREATE TRIGGER jobs_set_slug BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.set_job_slug();