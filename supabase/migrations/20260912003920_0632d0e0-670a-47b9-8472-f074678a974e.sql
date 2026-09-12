-- 1) Plans
CREATE TABLE public.subscription_plans (
  code text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL DEFAULT '',
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  list_price_monthly numeric,
  currency text NOT NULL DEFAULT 'SAR',
  active_jobs int NOT NULL DEFAULT 1,
  active_shifts int NOT NULL DEFAULT 1,
  featured_jobs int NOT NULL DEFAULT 0,
  urgent_shifts int NOT NULL DEFAULT 0,
  candidate_searches int NOT NULL DEFAULT 0,
  ai_credits int NOT NULL DEFAULT 0,
  recruiter_seats int NOT NULL DEFAULT 1,
  grace_days int NOT NULL DEFAULT 3,
  is_trial boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.subscription_plans
(code,name_ar,name_en,description_ar,price_monthly,price_yearly,list_price_monthly,currency,active_jobs,active_shifts,featured_jobs,urgent_shifts,candidate_searches,ai_credits,recruiter_seats,grace_days,is_trial,sort_order)
VALUES
('trial','التجربة المجانية','Free trial','تُضاف تلقائياً عند تسجيل المنشأة: 30 يوماً كاملة بدون بطاقة دفع.',0,0,NULL,'SAR',5,5,1,1,25,20,1,0,true,0),
('basic','الأساسية','Basic','وصول مرن للمنشآت الصغيرة والعيادات.',149,1490,299,'SAR',7,7,1,1,25,20,1,3,false,1),
('pro','الاحترافية','Professional','للمستشفيات وفرق التوظيف النشطة.',299,2990,599,'SAR',20,20,3,3,250,200,2,7,false,2);

-- 2) Facility subscriptions
CREATE TABLE public.facility_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL UNIQUE REFERENCES public.facilities(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES public.subscription_plans(code),
  status text NOT NULL DEFAULT 'trialing',
  billing_period text NOT NULL DEFAULT 'monthly',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  searches_used int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.facility_subscriptions TO authenticated;
GRANT ALL ON public.facility_subscriptions TO service_role;
ALTER TABLE public.facility_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub owner read" ON public.facility_subscriptions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_subscriptions.facility_id AND (f.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role))));
CREATE POLICY "sub owner insert" ON public.facility_subscriptions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_subscriptions.facility_id AND f.user_id = auth.uid()));
CREATE POLICY "sub owner update" ON public.facility_subscriptions FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_subscriptions.facility_id AND (f.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role))))
WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_subscriptions.facility_id AND (f.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role))));
CREATE TRIGGER facility_subs_updated_at BEFORE UPDATE ON public.facility_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto trial on facility creation
CREATE OR REPLACE FUNCTION public.start_facility_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.facility_subscriptions (facility_id, plan_code, status, ends_at)
  VALUES (NEW.id, 'trial', 'trialing', now() + interval '30 days')
  ON CONFLICT (facility_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER facilities_start_trial AFTER INSERT ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.start_facility_trial();

INSERT INTO public.facility_subscriptions (facility_id, plan_code, status, ends_at)
SELECT id, 'trial', 'trialing', now() + interval '30 days' FROM public.facilities
ON CONFLICT (facility_id) DO NOTHING;

-- 3) Job / shift listing fields
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS applications_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS facility_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS applications_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS facility_verified boolean NOT NULL DEFAULT false;

UPDATE public.jobs j SET facility_verified = f.is_verified FROM public.facilities f WHERE f.id = j.facility_id;
UPDATE public.shifts s SET facility_verified = f.is_verified FROM public.facilities f WHERE f.id = s.facility_id;
UPDATE public.jobs SET expires_at = created_at + interval '30 days' WHERE expires_at IS NULL;
UPDATE public.jobs j SET applications_count = (SELECT count(*) FROM public.applications a WHERE a.job_id = j.id);
UPDATE public.shifts s SET applications_count = (SELECT count(*) FROM public.shift_bookings b WHERE b.shift_id = s.id);

-- sync verified flag
CREATE OR REPLACE FUNCTION public.sync_listing_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'facilities' THEN
    UPDATE public.jobs SET facility_verified = NEW.is_verified WHERE facility_id = NEW.id;
    UPDATE public.shifts SET facility_verified = NEW.is_verified WHERE facility_id = NEW.id;
    RETURN NEW;
  END IF;
  SELECT f.is_verified INTO NEW.facility_verified FROM public.facilities f WHERE f.id = NEW.facility_id;
  NEW.facility_verified = COALESCE(NEW.facility_verified, false);
  RETURN NEW;
END; $$;
CREATE TRIGGER facilities_sync_verified AFTER UPDATE OF is_verified ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_verified();
CREATE TRIGGER jobs_sync_verified BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_verified();
CREATE TRIGGER shifts_sync_verified BEFORE INSERT ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_verified();

-- applicant counters
CREATE OR REPLACE FUNCTION public.bump_job_applications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
    RETURN NEW;
  END IF;
  UPDATE public.jobs SET applications_count = greatest(applications_count - 1, 0) WHERE id = OLD.job_id;
  RETURN OLD;
END; $$;
CREATE TRIGGER applications_count_trg AFTER INSERT OR DELETE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.bump_job_applications();

CREATE OR REPLACE FUNCTION public.bump_shift_bookings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shifts SET applications_count = applications_count + 1 WHERE id = NEW.shift_id;
    RETURN NEW;
  END IF;
  UPDATE public.shifts SET applications_count = greatest(applications_count - 1, 0) WHERE id = OLD.shift_id;
  RETURN OLD;
END; $$;
CREATE TRIGGER shift_bookings_count_trg AFTER INSERT OR DELETE ON public.shift_bookings
FOR EACH ROW EXECUTE FUNCTION public.bump_shift_bookings();

-- 4) Hide facility identity from the public
DROP POLICY IF EXISTS "facilities public read" ON public.facilities;
CREATE POLICY "facility owner read" ON public.facilities FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::public.app_role));
REVOKE SELECT ON public.facilities FROM anon;