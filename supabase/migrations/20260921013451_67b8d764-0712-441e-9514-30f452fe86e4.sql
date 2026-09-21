CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  region_ar text NOT NULL,
  region_en text NOT NULL,
  city_ar text NOT NULL,
  city_en text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS locations_country_city_key
  ON public.locations (country, city_ar);
CREATE INDEX IF NOT EXISTS locations_country_active_idx
  ON public.locations (country, is_active);

GRANT SELECT ON public.locations TO anon;
GRANT SELECT ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_public_read_active" ON public.locations;
CREATE POLICY "locations_public_read_active"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_locations_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS locations_touch_updated_at ON public.locations;
CREATE TRIGGER locations_touch_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.touch_locations_updated_at();

-- ── تعبئة أولية ──────────────────────────────────────────────────────────────
INSERT INTO public.locations (country, region_ar, region_en, city_ar, city_en, sort_order) VALUES
('اليمن','أمانة العاصمة','Amanat Al Asimah','صنعاء','Sanaa',1),
('اليمن','أمانة العاصمة','Amanat Al Asimah','شعوب','Shuaub',2),
('اليمن','أمانة العاصمة','Amanat Al Asimah','السبعين','Assabain',3),
('اليمن','أمانة العاصمة','Amanat Al Asimah','معين','Maeen',4),
('اليمن','أمانة العاصمة','Amanat Al Asimah','الثورة','Ath Thawrah',5),
('اليمن','أمانة العاصمة','Amanat Al Asimah','الصافية','As Safiyah',6),
('اليمن','أمانة العاصمة','Amanat Al Asimah','التحرير','At Tahrir',7),
('اليمن','أمانة العاصمة','Amanat Al Asimah','الوحدة','Al Wahdah',8),
('اليمن','أمانة العاصمة','Amanat Al Asimah','آزال','Azal',9),
('اليمن','أمانة العاصمة','Amanat Al Asimah','بني الحارث','Bani Al Harith',10),
('اليمن','أمانة العاصمة','Amanat Al Asimah','الصافية الجديدة','New Safiyah',11),
('اليمن','صنعاء','Sanaa','همدان','Hamdan',20),
('اليمن','صنعاء','Sanaa','بني مطر','Bani Matar',21),
('اليمن','صنعاء','Sanaa','سنحان','Sanhan',22),
('اليمن','صنعاء','Sanaa','أرحب','Arhab',23),
('اليمن','صنعاء','Sanaa','نهم','Nihm',24),
('اليمن','صنعاء','Sanaa','خولان','Khawlan',25),
('اليمن','صنعاء','Sanaa','بلاد الروس','Bilad Ar Rus',26),
('اليمن','صنعاء','Sanaa','مناخة','Manakhah',27),
('اليمن','صنعاء','Sanaa','الحيمة الخارجية','Al Haymah Al Kharijiyah',28),
('اليمن','صنعاء','Sanaa','جحانة','Jihanah',29),
('اليمن','عدن','Aden','كريتر','Crater',40),
('اليمن','عدن','Aden','المعلا','Al Mualla',41),
('اليمن','عدن','Aden','التواهي','At Tawahi',42),
('اليمن','عدن','Aden','خور مكسر','Khormaksar',43),
('اليمن','عدن','Aden','الشيخ عثمان','Ash Shaikh Outhman',44),
('اليمن','عدن','Aden','المنصورة','Al Mansurah',45),
('اليمن','عدن','Aden','دار سعد','Dar Sad',46),
('اليمن','عدن','Aden','البريقة','Al Buraiqeh',47),
('اليمن','تعز','Taiz','المظفر','Al Mudhaffar',60),
('اليمن','تعز','Taiz','القاهرة','Al Qahirah',61),
('اليمن','تعز','Taiz','صالة','Salh',62),
('اليمن','تعز','Taiz','التربة','At Turbah',63),
('اليمن','تعز','Taiz','المخا','Mocha',64),
('اليمن','تعز','Taiz','الشمايتين','Ash Shamayatayn',65),
('اليمن','تعز','Taiz','المعافر','Al Maafer',66),
('اليمن','تعز','Taiz','موزع','Mawza',67),
('اليمن','تعز','Taiz','مقبنة','Maqbanah',68),
('اليمن','تعز','Taiz','حيفان','Hayfan',69),
('اليمن','الحديدة','Al Hudaydah','الحديدة','Al Hudaydah',80),
('اليمن','الحديدة','Al Hudaydah','باجل','Bajil',81),
('اليمن','الحديدة','Al Hudaydah','زبيد','Zabid',82),
('اليمن','الحديدة','Al Hudaydah','بيت الفقيه','Bayt Al Faqih',83),
('اليمن','الحديدة','Al Hudaydah','الزيدية','Az Zaydiyah',84),
('اليمن','الحديدة','Al Hudaydah','المراوعة','Al Marawiah',85),
('اليمن','الحديدة','Al Hudaydah','الحالي','Al Hali',86),
('اليمن','الحديدة','Al Hudaydah','الميناء','Al Mina',87),
('اليمن','الحديدة','Al Hudaydah','حيس','Hays',88),
('اليمن','حضرموت','Hadramout','المكلا','Mukalla',100),
('اليمن','حضرموت','Hadramout','سيئون','Seiyun',101),
('اليمن','حضرموت','Hadramout','تريم','Tarim',102),
('اليمن','حضرموت','Hadramout','الشحر','Ash Shihr',103),
('اليمن','حضرموت','Hadramout','غيل باوزير','Ghayl Ba Wazir',104),
('اليمن','حضرموت','Hadramout','القطن','Al Qatn',105),
('اليمن','حضرموت','Hadramout','الديس الشرقية','Ad Dis Ash Sharqiyah',106),
('اليمن','حضرموت','Hadramout','شبام','Shibam',107),
('اليمن','إب','Ibb','إب','Ibb',120),
('اليمن','إب','Ibb','جبلة','Jibla',121),
('اليمن','إب','Ibb','يريم','Yarim',122),
('اليمن','إب','Ibb','العدين','Al Udayn',123),
('اليمن','إب','Ibb','بعدان','Badan',124),
('اليمن','إب','Ibb','القاعدة','Al Qaidah',125),
('اليمن','إب','Ibb','مذيخرة','Mudhaykhirah',126),
('اليمن','إب','Ibb','حبيش','Hubaysh',127),
('اليمن','ذمار','Dhamar','ذمار','Dhamar',140),
('اليمن','ذمار','Dhamar','معبر','Maabar',141),
('اليمن','ذمار','Dhamar','عنس','Anss',142),
('اليمن','ذمار','Dhamar','جهران','Jahran',143),
('اليمن','ذمار','Dhamar','الحداء','Al Hada',144),
('اليمن','ذمار','Dhamar','وصاب العالي','Wusab Al Ali',145),
('اليمن','مأرب','Marib','مأرب','Marib',160),
('اليمن','مأرب','Marib','مدينة مأرب','Marib City',161),
('اليمن','مأرب','Marib','الوادي','Marib Al Wadi',162),
('اليمن','مأرب','Marib','حريب','Harib',163),
('اليمن','لحج','Lahij','الحوطة','Al Houta',180),
('اليمن','لحج','Lahij','تبن','Tuban',181),
('اليمن','لحج','Lahij','ردفان','Radfan',182),
('اليمن','لحج','Lahij','الحبيلين','Al Habilayn',183),
('اليمن','لحج','Lahij','يافع','Yafa',184),
('اليمن','أبين','Abyan','زنجبار','Zinjibar',200),
('اليمن','أبين','Abyan','جعار','Jaar',201),
('اليمن','أبين','Abyan','لودر','Lawdar',202),
('اليمن','أبين','Abyan','خنفر','Khanfar',203),
('اليمن','أبين','Abyan','أحور','Ahwar',204),
('اليمن','شبوة','Shabwah','عتق','Ataq',220),
('اليمن','شبوة','Shabwah','بيحان','Bayhan',221),
('اليمن','شبوة','Shabwah','رضوم','Radhum',222),
('اليمن','شبوة','Shabwah','جردان','Jardan',223),
('اليمن','شبوة','Shabwah','ميفعة','Mayfaa',224),
('اليمن','عمران','Amran','عمران','Amran',240),
('اليمن','عمران','Amran','ريدة','Raydah',241),
('اليمن','عمران','Amran','حوث','Huth',242),
('اليمن','عمران','Amran','خمر','Khamir',243),
('اليمن','عمران','Amran','ذيبين','Dhibin',244),
('اليمن','حجة','Hajjah','حجة','Hajjah',260),
('اليمن','حجة','Hajjah','عبس','Abs',261),
('اليمن','حجة','Hajjah','حرض','Haradh',262),
('اليمن','حجة','Hajjah','المحابشة','Al Mahabishah',263),
('اليمن','حجة','Hajjah','ميدي','Midi',264),
('اليمن','حجة','Hajjah','كحلان عفار','Kuhlan Affar',265),
('اليمن','المحويت','Al Mahwit','المحويت','Al Mahwit',280),
('اليمن','المحويت','Al Mahwit','الطويلة','At Tawilah',281),
('اليمن','المحويت','Al Mahwit','شبام كوكبان','Shibam Kawkaban',282),
('اليمن','المحويت','Al Mahwit','الرجم','Ar Rujum',283),
('اليمن','ريمة','Raymah','الجبين','Al Jabin',300),
('اليمن','ريمة','Raymah','بلاد الطعام','Bilad At Taam',301),
('اليمن','ريمة','Raymah','السلفية','As Salafiyah',302),
('اليمن','ريمة','Raymah','كسمة','Kusmah',303),
('اليمن','البيضاء','Al Bayda','البيضاء','Al Bayda',320),
('اليمن','البيضاء','Al Bayda','رداع','Rada',321),
('اليمن','البيضاء','Al Bayda','مكيراس','Mukayras',322),
('اليمن','البيضاء','Al Bayda','ذي ناعم','Dhi Naim',323),
('اليمن','الضالع','Ad Dhale','الضالع','Ad Dhale',340),
('اليمن','الضالع','Ad Dhale','دمت','Damt',341),
('اليمن','الضالع','Ad Dhale','قعطبة','Qatabah',342),
('اليمن','الضالع','Ad Dhale','الأزارق','Al Azariq',343),
('اليمن','الجوف','Al Jawf','الحزم','Al Hazm',360),
('اليمن','الجوف','Al Jawf','المتون','Al Matun',361),
('اليمن','الجوف','Al Jawf','برط العنان','Barat Al Anan',362),
('اليمن','صعدة','Saada','صعدة','Saada',380),
('اليمن','صعدة','Saada','سحار','Sahar',381),
('اليمن','صعدة','Saada','باقم','Baqim',382),
('اليمن','صعدة','Saada','حيدان','Haydan',383),
('اليمن','صعدة','Saada','مجز','Majz',384),
('اليمن','المهرة','Al Mahrah','الغيضة','Al Ghaydah',400),
('اليمن','المهرة','Al Mahrah','سيحوت','Sayhut',401),
('اليمن','المهرة','Al Mahrah','قشن','Qishn',402),
('اليمن','المهرة','Al Mahrah','حصوين','Hawf',403),
('اليمن','سقطرى','Socotra','حديبو','Hadibu',420),
('اليمن','سقطرى','Socotra','قلنسية','Qulensya',421),
('السعودية','الرياض','Riyadh','الرياض','Riyadh',1000),
('السعودية','الرياض','Riyadh','الخرج','Al Kharj',1001),
('السعودية','الرياض','Riyadh','الدوادمي','Dawadmi',1002),
('السعودية','مكة المكرمة','Makkah','جدة','Jeddah',1010),
('السعودية','مكة المكرمة','Makkah','مكة المكرمة','Makkah',1011),
('السعودية','مكة المكرمة','Makkah','الطائف','Taif',1012),
('السعودية','المنطقة الشرقية','Eastern Province','الدمام','Dammam',1020),
('السعودية','المنطقة الشرقية','Eastern Province','الخبر','Khobar',1021),
('السعودية','المنطقة الشرقية','Eastern Province','الأحساء','Al Ahsa',1022),
('السعودية','المنطقة الشرقية','Eastern Province','الجبيل','Jubail',1023),
('السعودية','المدينة المنورة','Madinah','المدينة المنورة','Madinah',1030),
('السعودية','المدينة المنورة','Madinah','ينبع','Yanbu',1031),
('السعودية','عسير','Asir','أبها','Abha',1040),
('السعودية','عسير','Asir','خميس مشيط','Khamis Mushait',1041),
('الإمارات','دبي','Dubai','دبي','Dubai',1100),
('الإمارات','دبي','Dubai','جبل علي','Jebel Ali',1101),
('الإمارات','أبوظبي','Abu Dhabi','أبوظبي','Abu Dhabi',1110),
('الإمارات','أبوظبي','Abu Dhabi','العين','Al Ain',1111),
('الإمارات','الشارقة','Sharjah','الشارقة','Sharjah',1120),
('الإمارات','عجمان','Ajman','عجمان','Ajman',1130),
('مصر','القاهرة','Cairo','مدينة نصر','Nasr City',1200),
('مصر','القاهرة','Cairo','المعادي','Maadi',1201),
('مصر','القاهرة','Cairo','مصر الجديدة','Heliopolis',1202),
('مصر','القاهرة','Cairo','التجمع الخامس','Fifth Settlement',1203),
('مصر','القاهرة','Cairo','وسط البلد','Downtown',1204),
('مصر','الجيزة','Giza','الدقي','Dokki',1210),
('مصر','الجيزة','Giza','المهندسين','Mohandessin',1211),
('مصر','الجيزة','Giza','6 أكتوبر','6th of October',1212),
('مصر','الجيزة','Giza','الشيخ زايد','Sheikh Zayed',1213),
('مصر','الإسكندرية','Alexandria','سموحة','Smouha',1220),
('مصر','الإسكندرية','Alexandria','سيدي جابر','Sidi Gaber',1221),
('مصر','الإسكندرية','Alexandria','المنتزه','Montazah',1222),
('مصر','الدقهلية','Dakahlia','المنصورة','Mansoura',1230),
('مصر','الدقهلية','Dakahlia','ميت غمر','Mit Ghamr',1231),
('قطر','الدوحة','Doha','الدوحة','Doha',1300),
('قطر','الريان','Al Rayyan','الريان','Al Rayyan',1301),
('قطر','الوكرة','Al Wakrah','الوكرة','Al Wakrah',1302),
('الكويت','العاصمة','Capital','مدينة الكويت','Kuwait City',1400),
('الكويت','حولي','Hawalli','حولي','Hawalli',1401),
('الكويت','حولي','Hawalli','السالمية','Salmiya',1402),
('الكويت','الفروانية','Farwaniya','الفروانية','Farwaniya',1403),
('عُمان','مسقط','Muscat','مسقط','Muscat',1500),
('عُمان','مسقط','Muscat','السيب','Seeb',1501),
('عُمان','ظفار','Dhofar','صلالة','Salalah',1502),
('عُمان','الباطنة','Al Batinah','صحار','Sohar',1503)
ON CONFLICT (country, city_ar) DO NOTHING;

-- أي مدينة مستخدمة فعلياً في البيانات الحالية تُدرج حتى لا تُفقد
INSERT INTO public.locations (country, region_ar, region_en, city_ar, city_en, sort_order)
SELECT DISTINCT s.country, s.city, s.city, s.city, s.city, 9000
FROM (
  SELECT country, city FROM public.jobs
  UNION SELECT country, city FROM public.shifts
  UNION SELECT country, city FROM public.facilities
  UNION SELECT country, city FROM public.healthcare_professionals
  UNION SELECT country, city FROM public.profiles
) s
WHERE coalesce(btrim(s.country),'') <> '' AND coalesce(btrim(s.city),'') <> ''
ON CONFLICT (country, city_ar) DO NOTHING;

-- ── دوال الإدارة ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_upsert_location(
  _id uuid,
  _country text,
  _region_ar text,
  _region_en text,
  _city_ar text,
  _city_en text,
  _sort_order integer,
  _is_active boolean
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row_id uuid;
BEGIN
  PERFORM public.require_admin_mfa();
  IF coalesce(btrim(_country),'') = '' OR coalesce(btrim(_region_ar),'') = ''
     OR coalesce(btrim(_city_ar),'') = '' THEN
    RAISE EXCEPTION 'LOCATION_INCOMPLETE';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.locations (country, region_ar, region_en, city_ar, city_en, sort_order, is_active)
    VALUES (
      public.canonical_country(btrim(_country)),
      btrim(_region_ar), btrim(coalesce(nullif(btrim(_region_en),''), _region_ar)),
      btrim(_city_ar), btrim(coalesce(nullif(btrim(_city_en),''), _city_ar)),
      coalesce(_sort_order, 0), coalesce(_is_active, true))
    ON CONFLICT (country, city_ar) DO UPDATE SET
      region_ar = EXCLUDED.region_ar,
      region_en = EXCLUDED.region_en,
      city_en = EXCLUDED.city_en,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active
    RETURNING id INTO _row_id;
  ELSE
    UPDATE public.locations SET
      country = public.canonical_country(btrim(_country)),
      region_ar = btrim(_region_ar),
      region_en = btrim(coalesce(nullif(btrim(_region_en),''), _region_ar)),
      city_ar = btrim(_city_ar),
      city_en = btrim(coalesce(nullif(btrim(_city_en),''), _city_ar)),
      sort_order = coalesce(_sort_order, 0),
      is_active = coalesce(_is_active, true)
    WHERE id = _id
    RETURNING id INTO _row_id;
    IF _row_id IS NULL THEN
      RAISE EXCEPTION 'LOCATION_NOT_FOUND';
    END IF;
  END IF;

  RETURN _row_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_location_active(_id uuid, _is_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_admin_mfa();
  UPDATE public.locations SET is_active = coalesce(_is_active, true) WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'LOCATION_NOT_FOUND'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.admin_upsert_location(uuid, text, text, text, text, text, integer, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_location_active(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_location(uuid, text, text, text, text, text, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_location_active(uuid, boolean) TO authenticated;