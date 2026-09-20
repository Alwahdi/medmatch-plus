-- DEV/TEST FIXTURES ONLY — never run against production data.
-- Originally part of the initial migration; moved out in Phase 56 because
-- ownerless demo facilities leaked into the public listing surface.
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