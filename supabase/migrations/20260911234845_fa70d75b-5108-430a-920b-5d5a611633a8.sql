-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','facility','professional');
CREATE TYPE public.credential_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.application_status AS ENUM ('submitted','reviewing','shortlisted','interview','offer','hired','rejected');
CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contract','locum','shift');
CREATE TYPE public.shift_status AS ENUM ('open','booked','cancelled','completed');

-- UPDATED AT HELPER
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  country TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "self assign non admin role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  IF COALESCE(NEW.raw_user_meta_data->>'role','professional') IN ('professional','facility') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (COALESCE(NEW.raw_user_meta_data->>'role','professional'))::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SPECIALTIES
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'doctor'
);
GRANT SELECT ON public.specialties TO anon, authenticated;
GRANT ALL ON public.specialties TO service_role;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties public read" ON public.specialties FOR SELECT TO anon, authenticated USING (true);

-- FACILITIES
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  facility_type TEXT NOT NULL DEFAULT 'hospital',
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facilities TO authenticated;
GRANT SELECT ON public.facilities TO anon;
GRANT ALL ON public.facilities TO service_role;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities public read" ON public.facilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "facility owner insert" ON public.facilities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "facility owner update" ON public.facilities FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "facility owner delete" ON public.facilities FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROFESSIONALS
CREATE TABLE public.healthcare_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  headline TEXT,
  specialty_id UUID REFERENCES public.specialties(id),
  years_experience INT NOT NULL DEFAULT 0,
  country TEXT,
  city TEXT,
  bio TEXT,
  license_country TEXT,
  license_number TEXT,
  is_open_to_shifts BOOLEAN NOT NULL DEFAULT true,
  expected_salary NUMERIC,
  currency TEXT NOT NULL DEFAULT 'SAR',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.healthcare_professionals TO authenticated;
GRANT ALL ON public.healthcare_professionals TO service_role;
ALTER TABLE public.healthcare_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pro own read" ON public.healthcare_professionals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'facility'));
CREATE POLICY "pro own insert" ON public.healthcare_professionals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pro own update" ON public.healthcare_professionals FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER pros_updated_at BEFORE UPDATE ON public.healthcare_professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CREDENTIALS
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_path TEXT,
  status public.credential_status NOT NULL DEFAULT 'pending',
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentials TO authenticated;
GRANT ALL ON public.credentials TO service_role;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cred own read" ON public.credentials FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cred own insert" ON public.credentials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cred own update" ON public.credentials FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cred own delete" ON public.credentials FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER creds_updated_at BEFORE UPDATE ON public.credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- JOBS
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  specialty_id UUID REFERENCES public.specialties(id),
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  salary_min NUMERIC NOT NULL,
  salary_max NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  min_experience INT NOT NULL DEFAULT 0,
  required_license TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs public read" ON public.jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "jobs facility insert" ON public.jobs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));
CREATE POLICY "jobs facility update" ON public.jobs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));
CREATE POLICY "jobs facility delete" ON public.jobs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  cover_letter TEXT,
  status public.application_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app own read" ON public.applications FOR SELECT TO authenticated USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.jobs j JOIN public.facilities f ON f.id = j.facility_id WHERE j.id = job_id AND f.user_id = auth.uid())
);
CREATE POLICY "app own insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app status update" ON public.applications FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs j JOIN public.facilities f ON f.id = j.facility_id WHERE j.id = job_id AND f.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.jobs j JOIN public.facilities f ON f.id = j.facility_id WHERE j.id = job_id AND f.user_id = auth.uid())
);
CREATE TRIGGER apps_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SHIFTS
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id),
  title TEXT NOT NULL,
  notes TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  status public.shift_status NOT NULL DEFAULT 'open',
  booked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT SELECT ON public.shifts TO anon;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts public read" ON public.shifts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "shifts facility insert" ON public.shifts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));
CREATE POLICY "shifts facility update" ON public.shifts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));
CREATE POLICY "shifts facility delete" ON public.shifts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));
CREATE TRIGGER shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SHIFT BOOKINGS
CREATE TABLE public.shift_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_bookings TO authenticated;
GRANT ALL ON public.shift_bookings TO service_role;
ALTER TABLE public.shift_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking read" ON public.shift_bookings FOR SELECT TO authenticated USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.shifts s JOIN public.facilities f ON f.id = s.facility_id WHERE s.id = shift_id AND f.user_id = auth.uid())
);
CREATE POLICY "booking insert" ON public.shift_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "booking cancel" ON public.shift_bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SAVED JOBS
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved own" ON public.saved_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SEED: SPECIALTIES
INSERT INTO public.specialties (slug, name_ar, name_en, category) VALUES
('emergency','طب الطوارئ','Emergency Medicine','doctor'),
('internal','الباطنة','Internal Medicine','doctor'),
('pediatrics','طب الأطفال','Pediatrics','doctor'),
('obgyn','النساء والولادة','Obstetrics & Gynecology','doctor'),
('surgery','الجراحة العامة','General Surgery','doctor'),
('orthopedics','جراحة العظام','Orthopedics','doctor'),
('cardiology','أمراض القلب','Cardiology','doctor'),
('anesthesia','التخدير','Anesthesiology','doctor'),
('radiology','الأشعة','Radiology','doctor'),
('dentistry','طب الأسنان','Dentistry','doctor'),
('dermatology','الجلدية','Dermatology','doctor'),
('psychiatry','الطب النفسي','Psychiatry','doctor'),
('nursing-icu','تمريض العناية المركزة','ICU Nursing','nurse'),
('nursing-er','تمريض الطوارئ','ER Nursing','nurse'),
('nursing-general','تمريض عام','General Nursing','nurse'),
('midwifery','قبالة','Midwifery','nurse'),
('pharmacy-clinical','صيدلة إكلينيكية','Clinical Pharmacy','pharmacist'),
('pharmacy-community','صيدلة مجتمعية','Community Pharmacy','pharmacist'),
('lab','مختبرات طبية','Medical Laboratory','technician'),
('radiology-tech','فني أشعة','Radiology Technician','technician'),
('respiratory','العلاج التنفسي','Respiratory Therapy','technician'),
('physio','العلاج الطبيعي','Physiotherapy','technician');

-- SEED: FACILITIES
INSERT INTO public.facilities (id, name_ar, name_en, facility_type, country, city, description, is_verified) VALUES
('11111111-1111-4111-8111-000000000001','مستشفى الأمل التخصصي','Al Amal Specialist Hospital','hospital','السعودية','الرياض','مستشفى تخصصي بسعة ٣٠٠ سرير يخدم شمال الرياض.',true),
('11111111-1111-4111-8111-000000000002','مجمع النخبة الطبي','Elite Medical Complex','clinic','السعودية','جدة','مجمع عيادات متعدد التخصصات في حي الروضة.',true),
('11111111-1111-4111-8111-000000000003','مستشفى النيل التخصصي','Nile Specialized Hospital','hospital','مصر','القاهرة','مستشفى خاص متكامل في مدينة نصر.',true),
('11111111-1111-4111-8111-000000000004','مركز الخليج للرعاية','Gulf Care Center','clinic','الإمارات','دبي','مركز رعاية صحية أولية في الجميرا.',true),
('11111111-1111-4111-8111-000000000005','مستشفى الشفاء الجامعي','Al Shifa University Hospital','hospital','الأردن','عمّان','مستشفى تعليمي مرتبط بكلية الطب.',true),
('11111111-1111-4111-8111-000000000006','عيادات سلامة للأسنان','Salama Dental Clinics','clinic','الكويت','الكويت','سلسلة عيادات أسنان بأربعة فروع.',true);

-- SEED: JOBS
INSERT INTO public.jobs (facility_id, title, description, specialty_id, employment_type, country, city, salary_min, salary_max, currency, min_experience, required_license) VALUES
('11111111-1111-4111-8111-000000000001','استشاري طب طوارئ','العمل ضمن فريق الطوارئ على مدار الساعة، مع نظام مناوبات مرن وبدل سكن ومواصلات.',(SELECT id FROM public.specialties WHERE slug='emergency'),'full_time','السعودية','الرياض',38000,52000,'SAR',8,'SCFHS'),
('11111111-1111-4111-8111-000000000001','ممرض عناية مركزة','رعاية مرضى العناية المركزة للبالغين ضمن فريق تمريضي متكامل.',(SELECT id FROM public.specialties WHERE slug='nursing-icu'),'full_time','السعودية','الرياض',9000,13000,'SAR',3,'SCFHS'),
('11111111-1111-4111-8111-000000000001','أخصائي تخدير','تغطية غرف العمليات المجدولة والطارئة.',(SELECT id FROM public.specialties WHERE slug='anesthesia'),'full_time','السعودية','الرياض',28000,36000,'SAR',5,'SCFHS'),
('11111111-1111-4111-8111-000000000002','طبيب أسنان عام','عيادة أسنان مجهزة بالكامل مع نسبة من الإيرادات.',(SELECT id FROM public.specialties WHERE slug='dentistry'),'full_time','السعودية','جدة',15000,22000,'SAR',2,'SCFHS'),
('11111111-1111-4111-8111-000000000002','صيدلي إكلينيكي','مراجعة الخطط الدوائية والمشاركة في الجولات السريرية.',(SELECT id FROM public.specialties WHERE slug='pharmacy-clinical'),'full_time','السعودية','جدة',12000,17000,'SAR',3,'SCFHS'),
('11111111-1111-4111-8111-000000000002','أخصائي جلدية','عيادات جلدية وتجميل غير جراحي، دوام جزئي متاح.',(SELECT id FROM public.specialties WHERE slug='dermatology'),'part_time','السعودية','جدة',18000,26000,'SAR',4,'SCFHS'),
('11111111-1111-4111-8111-000000000003','أخصائي أطفال','عيادات خارجية وحضانة، مع فرص للتطوير المهني.',(SELECT id FROM public.specialties WHERE slug='pediatrics'),'full_time','مصر','القاهرة',25000,40000,'EGP',4,'نقابة الأطباء'),
('11111111-1111-4111-8111-000000000003','فني مختبر طبي','تشغيل أجهزة الكيمياء الحيوية وأمراض الدم.',(SELECT id FROM public.specialties WHERE slug='lab'),'full_time','مصر','القاهرة',9000,14000,'EGP',2,'نقابة العلميين'),
('11111111-1111-4111-8111-000000000004','طبيب أسرة','رعاية أولية شاملة لمرضى المركز.',(SELECT id FROM public.specialties WHERE slug='internal'),'full_time','الإمارات','دبي',30000,42000,'AED',5,'DHA'),
('11111111-1111-4111-8111-000000000004','أخصائي علاج طبيعي','جلسات إعادة تأهيل عضلي هيكلي.',(SELECT id FROM public.specialties WHERE slug='physio'),'contract','الإمارات','دبي',14000,19000,'AED',3,'DHA'),
('11111111-1111-4111-8111-000000000005','استشاري نساء وولادة','قسم ولادة نشط مع فريق تمريض مؤهل.',(SELECT id FROM public.specialties WHERE slug='obgyn'),'full_time','الأردن','عمّان',3000,4500,'JOD',7,'نقابة الأطباء'),
('11111111-1111-4111-8111-000000000006','طبيب تقويم أسنان','عيادة تقويم مجهزة بأحدث الأجهزة الرقمية.',(SELECT id FROM public.specialties WHERE slug='dentistry'),'full_time','الكويت','الكويت',1800,2600,'KWD',5,'وزارة الصحة');

-- SEED: SHIFTS
INSERT INTO public.shifts (facility_id, specialty_id, title, notes, starts_at, ends_at, hourly_rate, currency, country, city) VALUES
('11111111-1111-4111-8111-000000000001',(SELECT id FROM public.specialties WHERE slug='nursing-er'),'مناوبة ليلية - تمريض طوارئ','١٢ ساعة، وجبة مجانية.', now() + interval '1 day', now() + interval '1 day 12 hours',120,'SAR','السعودية','الرياض'),
('11111111-1111-4111-8111-000000000001',(SELECT id FROM public.specialties WHERE slug='emergency'),'مناوبة طبيب طوارئ','نهارية، الجمعة.', now() + interval '2 days', now() + interval '2 days 8 hours',350,'SAR','السعودية','الرياض'),
('11111111-1111-4111-8111-000000000002',(SELECT id FROM public.specialties WHERE slug='pharmacy-community'),'مناوبة صيدلي مسائية','٦ ساعات.', now() + interval '3 days', now() + interval '3 days 6 hours',95,'SAR','السعودية','جدة'),
('11111111-1111-4111-8111-000000000002',(SELECT id FROM public.specialties WHERE slug='dentistry'),'مناوبة طبيب أسنان - نهاية الأسبوع','السبت والأحد.', now() + interval '4 days', now() + interval '4 days 8 hours',280,'SAR','السعودية','جدة'),
('11111111-1111-4111-8111-000000000003',(SELECT id FROM public.specialties WHERE slug='nursing-general'),'مناوبة تمريض عام','دوام صباحي.', now() + interval '2 days', now() + interval '2 days 8 hours',150,'EGP','مصر','القاهرة'),
('11111111-1111-4111-8111-000000000004',(SELECT id FROM public.specialties WHERE slug='radiology-tech'),'مناوبة فني أشعة','تغطية أجهزة الأشعة المقطعية.', now() + interval '5 days', now() + interval '5 days 10 hours',110,'AED','الإمارات','دبي'),
('11111111-1111-4111-8111-000000000005',(SELECT id FROM public.specialties WHERE slug='nursing-icu'),'مناوبة عناية مركزة','ليلية.', now() + interval '3 days', now() + interval '3 days 12 hours',12,'JOD','الأردن','عمّان'),
('11111111-1111-4111-8111-000000000006',(SELECT id FROM public.specialties WHERE slug='dentistry'),'مناوبة عيادة أسنان','فرع السالمية.', now() + interval '6 days', now() + interval '6 days 6 hours',25,'KWD','الكويت','الكويت');