CREATE OR REPLACE FUNCTION public.normalize_job_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.description := btrim(NEW.description);
  NEW.city := btrim(coalesce(NEW.city,''));
  NEW.country := btrim(coalesce(NEW.country,''));
  -- التحقق من الموقع يقع على مُشغّل validate_job_location (INSERT أو تعديل الموقع فقط)،
  -- حتى لا تفشل تحديثات النظام الداخلية (مزامنة حالة التوثيق) بسبب إعلان قديم ناقص.
  NEW.required_license := nullif(btrim(coalesce(NEW.required_license,'')), '');
  NEW.currency := upper(btrim(coalesce(NEW.currency,'YER')));
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_shift_input()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.notes := nullif(btrim(coalesce(NEW.notes,'')), '');
  NEW.city := btrim(coalesce(NEW.city,''));
  NEW.country := btrim(coalesce(NEW.country,''));
  NEW.currency := upper(btrim(coalesce(NEW.currency,'YER')));
  RETURN NEW;
END $$;