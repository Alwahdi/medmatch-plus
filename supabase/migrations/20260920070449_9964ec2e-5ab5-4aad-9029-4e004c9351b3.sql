-- Phase 59: server-side validation contract for client-writable data.

-- 1) Normalization (trim / uppercase currency) -------------------------------
CREATE OR REPLACE FUNCTION public.normalize_profiles_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  IF NEW.full_name = '' THEN
    RAISE EXCEPTION 'FULL_NAME_REQUIRED' USING ERRCODE = '23514';
  END IF;
  NEW.phone := nullif(btrim(coalesce(NEW.phone,'')), '');
  NEW.country := nullif(btrim(coalesce(NEW.country,'')), '');
  NEW.city := nullif(btrim(coalesce(NEW.city,'')), '');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_profiles_input_trg ON public.profiles;
CREATE TRIGGER normalize_profiles_input_trg BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.normalize_profiles_input();

CREATE OR REPLACE FUNCTION public.normalize_professional_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  IF NEW.full_name = '' THEN
    RAISE EXCEPTION 'FULL_NAME_REQUIRED' USING ERRCODE = '23514';
  END IF;
  NEW.headline := nullif(btrim(coalesce(NEW.headline,'')), '');
  NEW.bio := nullif(btrim(coalesce(NEW.bio,'')), '');
  NEW.city := nullif(btrim(coalesce(NEW.city,'')), '');
  NEW.country := nullif(btrim(coalesce(NEW.country,'')), '');
  NEW.license_number := nullif(btrim(coalesce(NEW.license_number,'')), '');
  NEW.license_country := nullif(btrim(coalesce(NEW.license_country,'')), '');
  NEW.currency := upper(btrim(coalesce(NEW.currency,'YER')));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_professional_input_trg ON public.healthcare_professionals;
CREATE TRIGGER normalize_professional_input_trg BEFORE INSERT OR UPDATE ON public.healthcare_professionals
FOR EACH ROW EXECUTE FUNCTION public.normalize_professional_input();

CREATE OR REPLACE FUNCTION public.normalize_facility_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.name_ar := btrim(NEW.name_ar);
  NEW.name_en := nullif(btrim(coalesce(NEW.name_en,'')), '');
  NEW.city := btrim(NEW.city);
  NEW.country := btrim(NEW.country);
  NEW.facility_type := btrim(NEW.facility_type);
  NEW.description := nullif(btrim(coalesce(NEW.description,'')), '');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_facility_input_trg ON public.facilities;
CREATE TRIGGER normalize_facility_input_trg BEFORE INSERT OR UPDATE ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.normalize_facility_input();

CREATE OR REPLACE FUNCTION public.normalize_job_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.description := btrim(NEW.description);
  NEW.city := btrim(NEW.city);
  NEW.country := btrim(NEW.country);
  IF NEW.city = '' OR NEW.country = '' THEN
    RAISE EXCEPTION 'LOCATION_REQUIRED' USING ERRCODE = '23514';
  END IF;
  NEW.required_license := nullif(btrim(coalesce(NEW.required_license,'')), '');
  NEW.currency := upper(btrim(coalesce(NEW.currency,'YER')));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_job_input_trg ON public.jobs;
CREATE TRIGGER normalize_job_input_trg BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.normalize_job_input();

CREATE OR REPLACE FUNCTION public.normalize_shift_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.notes := nullif(btrim(coalesce(NEW.notes,'')), '');
  NEW.city := btrim(NEW.city);
  NEW.country := btrim(NEW.country);
  NEW.currency := upper(btrim(coalesce(NEW.currency,'YER')));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_shift_input_trg ON public.shifts;
CREATE TRIGGER normalize_shift_input_trg BEFORE INSERT OR UPDATE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.normalize_shift_input();

CREATE OR REPLACE FUNCTION public.normalize_document_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.doc_type := btrim(NEW.doc_type);
  NEW.issuer := nullif(btrim(coalesce(NEW.issuer,'')), '');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_credential_input_trg ON public.credentials;
CREATE TRIGGER normalize_credential_input_trg BEFORE INSERT OR UPDATE ON public.credentials
FOR EACH ROW EXECUTE FUNCTION public.normalize_document_input();
DROP TRIGGER IF EXISTS normalize_facility_document_input_trg ON public.facility_documents;
CREATE TRIGGER normalize_facility_document_input_trg BEFORE INSERT OR UPDATE ON public.facility_documents
FOR EACH ROW EXECUTE FUNCTION public.normalize_document_input();

CREATE OR REPLACE FUNCTION public.normalize_job_alert_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.country := nullif(btrim(coalesce(NEW.country,'')), '');
  NEW.city := nullif(btrim(coalesce(NEW.city,'')), '');
  NEW.whatsapp_phone := nullif(replace(btrim(coalesce(NEW.whatsapp_phone,'')), ' ', ''), '');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_job_alert_input_trg ON public.job_alerts;
CREATE TRIGGER normalize_job_alert_input_trg BEFORE INSERT OR UPDATE ON public.job_alerts
FOR EACH ROW EXECUTE FUNCTION public.normalize_job_alert_input();

CREATE OR REPLACE FUNCTION public.normalize_trusted_device_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.label := btrim(NEW.label);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS normalize_trusted_device_input_trg ON public.trusted_devices;
CREATE TRIGGER normalize_trusted_device_input_trg BEFORE INSERT OR UPDATE ON public.trusted_devices
FOR EACH ROW EXECUTE FUNCTION public.normalize_trusted_device_input();

-- 2) CHECK constraints (added NOT VALID, then validated) ---------------------
DO $mig$
DECLARE
  r record;
  specs text[][] := ARRAY[
    ['profiles','profiles_full_name_ck','char_length(full_name) <= 100'],
    ['profiles','profiles_phone_ck','phone IS NULL OR phone ~ ''^\+?[0-9]{7,15}$'''],
    ['profiles','profiles_place_ck','(country IS NULL OR char_length(country) <= 60) AND (city IS NULL OR char_length(city) <= 60)'],

    ['healthcare_professionals','hp_full_name_ck','btrim(full_name) <> '''' AND char_length(full_name) <= 100'],
    ['healthcare_professionals','hp_headline_ck','headline IS NULL OR char_length(headline) <= 150'],
    ['healthcare_professionals','hp_bio_ck','bio IS NULL OR char_length(bio) <= 1500'],
    ['healthcare_professionals','hp_license_ck','(license_number IS NULL OR char_length(license_number) <= 60) AND (license_country IS NULL OR char_length(license_country) <= 60)'],
    ['healthcare_professionals','hp_place_ck','(country IS NULL OR char_length(country) <= 60) AND (city IS NULL OR char_length(city) <= 60)'],
    ['healthcare_professionals','hp_years_ck','years_experience >= 0 AND years_experience <= 60'],
    ['healthcare_professionals','hp_salary_ck','expected_salary IS NULL OR (expected_salary >= 0 AND expected_salary <= 1000000000)'],
    ['healthcare_professionals','hp_currency_ck','currency ~ ''^[A-Z]{3}$'''],

    ['facilities','facilities_name_ck','btrim(name_ar) <> '''' AND char_length(name_ar) <= 120 AND (name_en IS NULL OR char_length(name_en) <= 120)'],
    ['facilities','facilities_place_ck','btrim(city) <> '''' AND char_length(city) <= 60 AND btrim(country) <> '''' AND char_length(country) <= 60'],
    ['facilities','facilities_type_ck','btrim(facility_type) <> '''' AND char_length(facility_type) <= 40'],
    ['facilities','facilities_description_ck','description IS NULL OR char_length(description) <= 1000'],
    ['facilities','facilities_website_ck','website IS NULL OR char_length(website) <= 300'],
    ['facilities','facilities_logo_ck','logo_url IS NULL OR char_length(logo_url) <= 500'],

    ['jobs','jobs_title_ck','char_length(btrim(title)) BETWEEN 3 AND 120'],
    ['jobs','jobs_description_ck','char_length(btrim(description)) BETWEEN 20 AND 5000'],
    ['jobs','jobs_place_ck','char_length(city) <= 60 AND char_length(country) <= 60'],
    ['jobs','jobs_salary_ck','salary_min >= 0 AND salary_max >= 0 AND salary_min <= salary_max AND salary_max <= 1000000000000'],
    ['jobs','jobs_experience_ck','min_experience >= 0 AND min_experience <= 60'],
    ['jobs','jobs_vacancies_ck','vacancies >= 1 AND vacancies <= 100'],
    ['jobs','jobs_currency_ck','currency ~ ''^[A-Z]{3}$'''],
    ['jobs','jobs_license_ck','required_license IS NULL OR char_length(required_license) <= 60'],

    ['shifts','shifts_title_ck','char_length(btrim(title)) BETWEEN 2 AND 120'],
    ['shifts','shifts_notes_ck','notes IS NULL OR char_length(notes) <= 1000'],
    ['shifts','shifts_place_ck','btrim(city) <> '''' AND char_length(city) <= 60 AND btrim(country) <> '''' AND char_length(country) <= 60'],
    ['shifts','shifts_rate_ck','hourly_rate >= 0 AND hourly_rate <= 1000000000'],
    ['shifts','shifts_currency_ck','currency ~ ''^[A-Z]{3}$'''],

    ['job_alerts','job_alerts_place_ck','(country IS NULL OR char_length(country) <= 60) AND (city IS NULL OR char_length(city) <= 60)'],
    ['job_alerts','job_alerts_phone_ck','whatsapp_phone IS NULL OR whatsapp_phone ~ ''^\+?[0-9]{7,15}$'''],
    ['job_alerts','job_alerts_channel_ck','channel IN (''email'',''whatsapp'',''in_app'')'],

    ['messages','messages_body_ck','char_length(body) <= 2000'],
    ['messages','messages_attachment_ck','(attachment_name IS NULL OR char_length(attachment_name) <= 255) AND (attachment_path IS NULL OR char_length(attachment_path) <= 500) AND (attachment_type IS NULL OR char_length(attachment_type) <= 120) AND (attachment_size IS NULL OR (attachment_size >= 0 AND attachment_size <= 10485760))'],
    ['message_reactions','message_reactions_emoji_ck','btrim(emoji) <> '''' AND char_length(emoji) <= 16'],

    ['credentials','credentials_text_ck','btrim(title) <> '''' AND char_length(title) <= 120 AND btrim(doc_type) <> '''' AND char_length(doc_type) <= 120 AND (issuer IS NULL OR char_length(issuer) <= 120) AND (file_path IS NULL OR char_length(file_path) <= 500)'],
    ['facility_documents','facility_documents_text_ck','btrim(title) <> '''' AND char_length(title) <= 120 AND btrim(doc_type) <> '''' AND char_length(doc_type) <= 120 AND (issuer IS NULL OR char_length(issuer) <= 120) AND (file_path IS NULL OR char_length(file_path) <= 500)'],

    ['profile_change_requests','pcr_value_ck','btrim(new_value) <> '''' AND char_length(new_value) <= 300 AND (old_value IS NULL OR char_length(old_value) <= 300) AND (reason IS NULL OR char_length(reason) <= 500) AND (attachment_path IS NULL OR char_length(attachment_path) <= 500)'],

    ['applications','applications_cover_ck','cover_letter IS NULL OR char_length(cover_letter) <= 2000'],

    ['reviews','reviews_comment_ck','comment IS NULL OR char_length(comment) <= 1000'],

    ['interviews','interviews_text_ck','(notes IS NULL OR char_length(notes) <= 1000) AND (location IS NULL OR char_length(location) <= 300) AND (meeting_url IS NULL OR char_length(meeting_url) <= 500) AND (candidate_note IS NULL OR char_length(candidate_note) <= 500) AND (outcome_note IS NULL OR char_length(outcome_note) <= 1000)'],

    ['contact_messages','contact_messages_text_ck','btrim(name) <> '''' AND char_length(name) <= 100 AND char_length(email) <= 255 AND (subject IS NULL OR char_length(subject) <= 150) AND btrim(message) <> '''' AND char_length(message) <= 2000'],

    ['trusted_devices','trusted_devices_text_ck','btrim(label) <> '''' AND char_length(label) <= 100 AND char_length(credential_id) <= 255 AND (user_agent IS NULL OR char_length(user_agent) <= 400)']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(specs, 1) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = specs[i][2] AND conrelid = ('public.' || specs[i][1])::regclass
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s) NOT VALID',
                     specs[i][1], specs[i][2], specs[i][3]);
    END IF;
    EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', specs[i][1], specs[i][2]);
  END LOOP;
END
$mig$;

-- 3) Validate pre-existing NOT VALID constraints now that data is clean.
DO $v$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shifts WHERE NOT (ends_at > starts_at AND ends_at <= starts_at + interval '24 hours')) THEN
    ALTER TABLE public.shifts VALIDATE CONSTRAINT shifts_duration_valid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profile_change_requests) THEN
    ALTER TABLE public.profile_change_requests VALIDATE CONSTRAINT profile_change_requests_allowed_field;
  END IF;
END
$v$;