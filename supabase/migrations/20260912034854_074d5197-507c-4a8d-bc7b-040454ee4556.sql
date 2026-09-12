CREATE TYPE public.review_direction AS ENUM ('pro_to_facility','facility_to_pro');

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction public.review_direction NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  professional_user_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (direction, facility_id, professional_user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_engagement(_facility_id uuid, _professional_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE j.facility_id = _facility_id AND a.user_id = _professional_user_id AND a.status = 'hired'
  ) OR EXISTS (
    SELECT 1 FROM public.shift_bookings b JOIN public.shifts s ON s.id = b.shift_id
    WHERE s.facility_id = _facility_id AND b.user_id = _professional_user_id AND b.status = 'confirmed'
  );
$$;

CREATE POLICY "public read facility reviews" ON public.reviews
  FOR SELECT USING (direction = 'pro_to_facility');

CREATE POLICY "pro reviews visible to related parties" ON public.reviews
  FOR SELECT TO authenticated USING (
    direction = 'facility_to_pro' AND (
      professional_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "authors write their review" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    author_user_id = auth.uid()
    AND public.has_engagement(facility_id, professional_user_id)
    AND (
      (direction = 'pro_to_facility' AND professional_user_id = auth.uid())
      OR (direction = 'facility_to_pro' AND EXISTS (
            SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()))
    )
  );

CREATE POLICY "authors edit their review" ON public.reviews
  FOR UPDATE TO authenticated USING (author_user_id = auth.uid()) WITH CHECK (author_user_id = auth.uid());

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS rating_avg numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.healthcare_professionals
  ADD COLUMN IF NOT EXISTS rating_avg numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_review_aggregates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  r := COALESCE(NEW, OLD);
  IF r.direction = 'pro_to_facility' THEN
    UPDATE public.facilities f SET
      rating_avg = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.reviews v WHERE v.facility_id = f.id AND v.direction = 'pro_to_facility'), 0),
      rating_count = (SELECT count(*) FROM public.reviews v WHERE v.facility_id = f.id AND v.direction = 'pro_to_facility')
    WHERE f.id = r.facility_id;
  ELSE
    UPDATE public.healthcare_professionals h SET
      rating_avg = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.reviews v WHERE v.professional_user_id = h.user_id AND v.direction = 'facility_to_pro'), 0),
      rating_count = (SELECT count(*) FROM public.reviews v WHERE v.professional_user_id = h.user_id AND v.direction = 'facility_to_pro')
    WHERE h.user_id = r.professional_user_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER reviews_sync_aggregates AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_review_aggregates();

CREATE OR REPLACE FUNCTION public.sync_pro_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _has_approved boolean;
BEGIN
  _uid := COALESCE(NEW.user_id, OLD.user_id);
  SELECT EXISTS (
    SELECT 1 FROM public.credentials c
    WHERE c.user_id = _uid AND c.status = 'approved' AND c.doc_type IN ('license','national_id','degree')
  ) INTO _has_approved;
  UPDATE public.healthcare_professionals SET is_verified = _has_approved WHERE user_id = _uid;
  RETURN NULL;
END; $$;

CREATE TRIGGER credentials_sync_verification AFTER INSERT OR UPDATE OR DELETE ON public.credentials
  FOR EACH ROW EXECUTE FUNCTION public.sync_pro_verification();

REVOKE EXECUTE ON FUNCTION public.sync_review_aggregates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_pro_verification() FROM PUBLIC, anon, authenticated;