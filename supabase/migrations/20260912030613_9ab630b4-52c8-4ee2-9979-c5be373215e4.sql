ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS vacancies integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS publisher_name text;

CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9\u0600-\u06FF]+', '-', 'g'),
      '-+', '-', 'g'
    )
  );
$$;

UPDATE public.jobs
SET slug = NULLIF(public.slugify(title), '') || '-' || left(replace(id::text, '-', ''), 6)
WHERE slug IS NULL;

UPDATE public.jobs SET slug = 'job-' || left(replace(id::text, '-', ''), 8)
WHERE slug IS NULL OR slug = '' OR slug LIKE '-%';

CREATE UNIQUE INDEX IF NOT EXISTS jobs_slug_key ON public.jobs (slug);

UPDATE public.jobs SET publisher_name = x.name
FROM (
  SELECT id, (ARRAY['أحمد الشامي','سارة المقطري','محمد الحداد','ليلى العمري','خالد السقاف','هدى الجرافي'])[1 + (abs(hashtext(id::text)) % 6)] AS name
  FROM public.jobs
) AS x
WHERE public.jobs.id = x.id AND public.jobs.publisher_name IS NULL;