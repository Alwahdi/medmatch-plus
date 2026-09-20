-- Phase 102: one canonical country dataset shared by the app and the database.
-- Storage stays as the canonical Arabic name; only known aliases are normalized.

CREATE OR REPLACE FUNCTION public.canonical_country(_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE lower(
           regexp_replace(
             regexp_replace(btrim(coalesce(_value, '')), '[\u064B-\u0652\u0640]', '', 'g'),
             '[\u0623\u0625\u0622]', '\u0627', 'g'))
    WHEN 'ye' THEN 'اليمن'
    WHEN 'اليمن' THEN 'اليمن'
    WHEN 'الجمهورية اليمنية' THEN 'اليمن'
    WHEN 'yemen' THEN 'اليمن'
    WHEN 'sa' THEN 'السعودية'
    WHEN 'ksa' THEN 'السعودية'
    WHEN 'السعودية' THEN 'السعودية'
    WHEN 'المملكة العربية السعودية' THEN 'السعودية'
    WHEN 'saudi arabia' THEN 'السعودية'
    WHEN 'ae' THEN 'الإمارات'
    WHEN 'uae' THEN 'الإمارات'
    WHEN 'الامارات' THEN 'الإمارات'
    WHEN 'الامارات العربية المتحدة' THEN 'الإمارات'
    WHEN 'united arab emirates' THEN 'الإمارات'
    WHEN 'eg' THEN 'مصر'
    WHEN 'مصر' THEN 'مصر'
    WHEN 'جمهورية مصر العربية' THEN 'مصر'
    WHEN 'egypt' THEN 'مصر'
    WHEN 'kw' THEN 'الكويت'
    WHEN 'الكويت' THEN 'الكويت'
    WHEN 'دولة الكويت' THEN 'الكويت'
    WHEN 'kuwait' THEN 'الكويت'
    WHEN 'qa' THEN 'قطر'
    WHEN 'قطر' THEN 'قطر'
    WHEN 'دولة قطر' THEN 'قطر'
    WHEN 'qatar' THEN 'قطر'
    WHEN 'jo' THEN 'الأردن'
    WHEN 'الاردن' THEN 'الأردن'
    WHEN 'المملكة الاردنية الهاشمية' THEN 'الأردن'
    WHEN 'jordan' THEN 'الأردن'
    WHEN 'bh' THEN 'البحرين'
    WHEN 'البحرين' THEN 'البحرين'
    WHEN 'مملكة البحرين' THEN 'البحرين'
    WHEN 'bahrain' THEN 'البحرين'
    WHEN 'om' THEN 'عُمان'
    WHEN 'عمان' THEN 'عُمان'
    WHEN 'سلطنة عمان' THEN 'عُمان'
    WHEN 'oman' THEN 'عُمان'
    WHEN 'ma' THEN 'المغرب'
    WHEN 'المغرب' THEN 'المغرب'
    WHEN 'المملكة المغربية' THEN 'المغرب'
    WHEN 'morocco' THEN 'المغرب'
    WHEN 'dz' THEN 'الجزائر'
    WHEN 'الجزائر' THEN 'الجزائر'
    WHEN 'algeria' THEN 'الجزائر'
    WHEN 'tn' THEN 'تونس'
    WHEN 'تونس' THEN 'تونس'
    WHEN 'tunisia' THEN 'تونس'
    WHEN 'iq' THEN 'العراق'
    WHEN 'العراق' THEN 'العراق'
    WHEN 'جمهورية العراق' THEN 'العراق'
    WHEN 'iraq' THEN 'العراق'
    WHEN 'lb' THEN 'لبنان'
    WHEN 'لبنان' THEN 'لبنان'
    WHEN 'lebanon' THEN 'لبنان'
    WHEN 'sy' THEN 'سوريا'
    WHEN 'سوريا' THEN 'سوريا'
    WHEN 'سورية' THEN 'سوريا'
    WHEN 'الجمهورية العربية السورية' THEN 'سوريا'
    WHEN 'syria' THEN 'سوريا'
    WHEN 'ps' THEN 'فلسطين'
    WHEN 'فلسطين' THEN 'فلسطين'
    WHEN 'دولة فلسطين' THEN 'فلسطين'
    WHEN 'palestine' THEN 'فلسطين'
    WHEN 'sd' THEN 'السودان'
    WHEN 'السودان' THEN 'السودان'
    WHEN 'جمهورية السودان' THEN 'السودان'
    WHEN 'sudan' THEN 'السودان'
    WHEN 'ly' THEN 'ليبيا'
    WHEN 'ليبيا' THEN 'ليبيا'
    WHEN 'دولة ليبيا' THEN 'ليبيا'
    WHEN 'libya' THEN 'ليبيا'
    -- Unknown / custom country text is preserved verbatim (trimmed only).
    ELSE btrim(coalesce(_value, ''))
  END
$$;

REVOKE ALL ON FUNCTION public.canonical_country(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.canonical_country(text) TO authenticated, service_role;

-- Idempotent normalization of existing rows (known aliases only).
UPDATE public.profiles
   SET country = public.canonical_country(country)
 WHERE country IS NOT NULL AND country <> public.canonical_country(country);

UPDATE public.healthcare_professionals
   SET country = public.canonical_country(country)
 WHERE country IS NOT NULL AND country <> public.canonical_country(country);

UPDATE public.healthcare_professionals
   SET license_country = public.canonical_country(license_country)
 WHERE license_country IS NOT NULL AND license_country <> public.canonical_country(license_country);

UPDATE public.facilities
   SET country = public.canonical_country(country)
 WHERE country IS NOT NULL AND country <> public.canonical_country(country);

UPDATE public.jobs
   SET country = public.canonical_country(country)
 WHERE country IS NOT NULL AND country <> public.canonical_country(country);

UPDATE public.shifts
   SET country = public.canonical_country(country)
 WHERE country IS NOT NULL AND country <> public.canonical_country(country);

UPDATE public.job_alerts
   SET country = public.canonical_country(country)
 WHERE country IS NOT NULL AND country <> public.canonical_country(country);
