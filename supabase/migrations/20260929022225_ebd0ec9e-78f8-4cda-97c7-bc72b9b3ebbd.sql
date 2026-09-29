CREATE TABLE public.districts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), city_location_id uuid NOT NULL REFERENCES public.locations(id), name_ar text NOT NULL, name_en text NOT NULL, is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(city_location_id,name_ar));
GRANT SELECT ON public.districts TO anon, authenticated;
GRANT ALL ON public.districts TO service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active districts are public" ON public.districts FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER districts_updated_at BEFORE UPDATE ON public.districts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.jobs ADD COLUMN district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.shifts ADD COLUMN district_id uuid REFERENCES public.districts(id);
CREATE INDEX jobs_district_idx ON public.jobs(district_id) WHERE district_id IS NOT NULL;
CREATE INDEX shifts_district_idx ON public.shifts(district_id) WHERE district_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.guard_listing_facility_location() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE f public.facilities%ROWTYPE;
BEGIN
 SELECT * INTO f FROM public.facilities WHERE id = NEW.facility_id;
 IF f.id IS NULL OR NEW.city IS DISTINCT FROM f.city OR public.canonical_country(NEW.country) IS DISTINCT FROM public.canonical_country(f.country) THEN RAISE EXCEPTION 'LISTING_FACILITY_LOCATION_MISMATCH'; END IF;
 IF NEW.district_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.districts d JOIN public.locations l ON l.id = d.city_location_id WHERE d.id = NEW.district_id AND d.is_active AND l.is_active AND l.city_ar = NEW.city AND public.canonical_country(l.country) = public.canonical_country(NEW.country)) THEN RAISE EXCEPTION 'INVALID_LISTING_DISTRICT'; END IF;
 RETURN NEW;
END; $fn$;
CREATE TRIGGER jobs_facility_location BEFORE INSERT OR UPDATE OF city,country,district_id,facility_id ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.guard_listing_facility_location();
CREATE TRIGGER shifts_facility_location BEFORE INSERT OR UPDATE OF city,country,district_id,facility_id ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.guard_listing_facility_location();
CREATE OR REPLACE FUNCTION private.admin_upsert_district(_id uuid,_city_location_id uuid,_name_ar text,_name_en text,_sort_order integer,_is_active boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE result uuid;
BEGIN
 PERFORM public.require_admin_mfa();
 IF _city_location_id IS NULL OR coalesce(length(btrim(_name_ar)),0) NOT BETWEEN 2 AND 80 OR coalesce(length(btrim(_name_en)),0) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'INVALID_DISTRICT'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.locations WHERE id = _city_location_id) THEN RAISE EXCEPTION 'CITY_NOT_FOUND'; END IF;
 IF _id IS NULL THEN
 INSERT INTO public.districts(city_location_id,name_ar,name_en,sort_order,is_active) VALUES (_city_location_id,btrim(_name_ar),btrim(_name_en),coalesce(_sort_order,0),coalesce(_is_active,true)) RETURNING id INTO result;
 ELSE
 UPDATE public.districts SET city_location_id = _city_location_id,name_ar=btrim(_name_ar),name_en=btrim(_name_en),sort_order=coalesce(_sort_order,0),is_active=coalesce(_is_active,true) WHERE id=_id RETURNING id INTO result;
 IF result IS NULL THEN RAISE EXCEPTION 'DISTRICT_NOT_FOUND'; END IF;
 END IF;
 RETURN result;
END; $fn$;
REVOKE ALL ON FUNCTION private.admin_upsert_district(uuid,uuid,text,text,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.admin_upsert_district(uuid,uuid,text,text,integer,boolean) TO authenticated;
CREATE FUNCTION public.admin_upsert_district(_id uuid,_city_location_id uuid,_name_ar text,_name_en text,_sort_order integer,_is_active boolean) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public AS $fn$ SELECT private.admin_upsert_district(_id,_city_location_id,_name_ar,_name_en,_sort_order,_is_active); $fn$;
REVOKE ALL ON FUNCTION public.admin_upsert_district(uuid,uuid,text,text,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_district(uuid,uuid,text,text,integer,boolean) TO authenticated;