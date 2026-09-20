# SyndeoCare — خارطة الطريق (نموذج Balto)

## المرحلة 1 — نموذج الدخل وإخفاء هوية المنشأة
- [x] إخفاء اسم المنشأة من الوظائف والمناوبات وصفحات التفاصيل ولوحات الكادر
- [x] شارات: مميّزة / جديدة / تغلق قريباً / مستعجلة / ناشر موثّق + عدّاد المتقدمين
- [x] جداول الباقات والاشتراكات + تجربة مجانية 30 يوماً تلقائية
- [x] صفحة الأسعار `/pricing` وربطها في الترويسة والتذييل
- [x] تطبيق حدود الباقة عند نشر الوظائف والمناوبات
- [x] التسعير والعملة: السوق الأساسي اليمن — العملة ريال يمني (YER)، أسعار اقتصادية (أساسية 20,000 / احترافية 45,000 شهرياً) + توسيع محافظات ومدن اليمن

## المرحلة 2 — ميزات المنافس
- [x] مراسلة داخل المنصة `/messages` + كشف هوية المنشأة عند التواصل أو قبول الطلب
- [x] بحث المرشحين `/facility/candidates` مع خصم حصة الباقة
- [x] تفضيلات تنبيهات الوظائف (بريد/واتساب) `/alerts`
- [x] بناء الملف المهني من السيرة الذاتية `/cv-import`
- [x] الوظائف المحفوظة `/saved` وصفحات التخصصات `/specialties`

## المرحلة 3 — المحتوى والثقة
- [x] صفحات: من نحن `/about`، تواصل `/contact`، الخصوصية `/privacy`، الشروط `/terms`
- [x] جدول رسائل التواصل (يقرأه الإدارة فقط)
- [x] الأدلة والمقالات `/guides` (4 أدلة)
- [x] بنوك أسئلة المقابلات `/interview-questions` (4 بنوك)
- [x] بنية تعدد اللغات + زر التبديل (عربي/إنجليزي) على الترويسة والتذييل
- [x] ترجمة كاملة عربي/إنجليزي لكل الصفحات العامة ولوحات الكادر والمنشأة والإدارة (تواريخ وعملات وحالات بلغة الواجهة)

## المرحلة 4 — التسجيل والدخول وOnboarding (نمط Balto)
- [x] صفحة تسجيل الباحثين `/register` (نوع الحساب، Google، الحقول كاملة)
- [x] صفحة تسجيل الناشرين `/register/employer` (تجربة 30 يوم، نوع الناشر، الدولة/المحافظة/المدينة)
- [x] صفحة دخول موحدة `/auth` بأسلوب Balto
- [x] Onboarding متعدد الخطوات للكادر والمنشأة
- [x] توجيه ما بعد الدخول: إدارة→/admin، منشأة→/facility، كادر→/dashboard، جديد→/onboarding
- [x] منطقة الحساب بقائمة جانبية مستقلة (بدون ترويسة/تذييل تسويقي) + إصلاح تعارض Hydration عند التحويل للدخول

## المرحلة 5 — ما تبقى
- [x] البيانات التجريبية تبقى في نسخة الإطلاق (قرار المالك — لا تنظيف)
- [x] اختبار شامل end-to-end: توجيه الدخول ✓ لوحة الكادر ✓ الوظائف ✓ إخفاء اسم المنشأة ✓ التقديم ✓ الحفظ ✓ المراسلة والتنبيهات تفتح ✓ بدون أخطاء
- [x] فحص أمني: لا ثغرات حرجة — تعيين دور «كادر» ذاتياً مقيّد ومقصود، وقفل الحذف على الاشتراكات وسجل التنبيهات مقصود

## محجوب على قرار/مزوّد خارجي
- [x] بنية إرسال التنبيهات جاهزة بالكامل (بريد + واتساب) مع سجل تسليم ونقطة تشغيل دورية — تعمل تلقائياً فور إدخال بيانات المزوّد
- [ ] بيانات مزوّد البريد (RESEND_API_KEY + ALERTS_FROM_EMAIL) — تُدخل عند الإطلاق
- [ ] بيانات واتساب (WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID) — تُدخل عند الإطلاق
- [x] بوابة الدفع — قرار مؤكد: بدون دفع في نسخة الإطلاق التجريبية (لا تفعيل Stripe الآن)

## المرحلة 8 — التدقيق الشامل للمنتج
- [x] P0: توحيد مصادر بيانات الكادر والتحقق من التخصص والمسمى والموقع وحالة التوثيق
- [x] P0: جعل بحث المرشحين وخصم الحصة عملية واحدة آمنة ومنع التكرار والأخطاء الجزئية
- [x] P0: مراجعة الصلاحيات والخصوصية وإلغاء العمليات غير الذرية
- [x] P0: إصلاح تداخل شريط الجوال واتجاه اللغة والاستجابة عبر المقاسات المعتمدة
- [x] P1: إعادة بناء لوحة المنشأة حول مؤشرات تشغيلية حقيقية وحالة التوثيق والإجراءات التالية
- [x] P1: توحيد إدارة الوظائف والمناوبات والمتقدمين وفصل أقسام المحتوى عن إجراء النشر
- [x] P1: توحيد بحث المرشحين وبطاقاتهم وحالات التحميل والخطأ والفراغ والنجاح
- [x] P1: تطبيق أنماط مشتركة للنماذج والحالات غير المتزامنة وإمكانية الوصول
- [x] P2: ضبط نظام التصميم العربي RTL والمصطلحات والمسافات والحواف والظلال
- [x] QA: اختبار رحلات المختص والصلاحيات والاستجابة من 320px إلى 1440px+ بلا امتداد أو أخطاء تشغيل
- [ ] QA: إعادة اختبار رحلة المنشأة كاملة بحساب منشأة — الحساب المتاح للاختبار حالياً حساب مختص

## المرحلة 9 — تقوية الإنتاج والمعاملات الحرجة
- [x] عمليات ذرية محمية للتقديم على الوظائف وحجز المناوبات وإرسال الدعوات وكتابة التقييمات
- [x] منع خصم حصة بحث المرشحين مرتين عند إعادة الطلب، مع مفتاح طلب ونتيجة قابلة للاسترجاع
- [x] منع الكتابات المباشرة الحرجة والتحقق خلفياً من الدور والملكية وحالة الإعلان والتعامل المؤكد
- [x] إصلاح خصوصية تقييمات الكوادر ومنع اطلاع منشأة على تقييمات منشأة أخرى
- [x] إصلاح فحص الأدوار داخل RLS ومنع الاستدعاء الدائري، مع تقييد حقول طلبات تعديل البيانات
- [x] جعل إعداد ملف المختص قابلاً لإعادة المحاولة، وإظهار فشل إنشاء ملف المنشأة بوضوح دون إخفائه
- [x] تصحيح اتجاه أسهم الرجوع في RTL وإزالة امتداد الترويسة عند عرض 1024px
- [x] QA: TypeScript والبناء ناجحان، ورحلات الضيف والمختص عبر 320/390/768/1024/1440 بلا أخطاء console أو امتداد
- [ ] QA: رحلة منشأة فعلية كاملة ما زالت تحتاج حساب منشأة مخصصاً غير مرتبط ببيانات إنتاجية

## المرحلة 6 — التوثيق والمراجعات والقيود (منجزة)
- [x] عدادات الرسائل غير المقروءة + معاينة آخر رسالة + علامات القراءة + Realtime + إرسال بـEnter
- [x] لوحة إدارة موسّعة: إحصائيات، تبويبات، معاينة ملفات الوثائق، سبب الرفض، توثيق المنشآت والكوادر، صندوق رسائل التواصل
- [x] نظام مراجعات ثنائي الاتجاه (كادر↔منشأة) بعد تعامل مؤكد + متوسطات تلقائية
- [x] توثيق الكادر تلقائياً عند اعتماد وثيقة الترخيص
- [x] صفحة ملف المرشح الكاملة للمنشأة (سجل الطلبات والمناوبات والتقييمات)
- [x] فرض حدود الباقة في الواجهة وفي قاعدة البيانات (منع النشر برسالة واضحة)

## المرحلة 6 — أمان الحساب
- [x] صفحة /security: تغيير كلمة المرور بمؤشر قوة، ربط/فك ربط جوجل، التحقق بخطوتين TOTP، الدخول بالبصمة (أجهزة موثوقة)، الجلسات النشطة وإنهاؤها

## المرحلة 7 — تجربة الرسائل (نمط واتساب)
- [x] بحث في قائمة المحادثات + معاينة وشارة غير مقروء
- [x] فواصل الأيام (اليوم/أمس) ووقت مختصر لكل رسالة
- [x] سطر إدخال واحد: إيموجي + مرفقات (صورة/كاميرا/مستند) + نص + إرسال/ميكروفون
- [x] مشغّل صوتي waveform + عارض صور/فيديو ملء الشاشة مع تحميل

## المرحلة 10 — رحلة اختيار المرشح (مكتملة)
- [x] مراحل مبسطة: جديد → قيد المراجعة → مقابلة/عرض → مُختار / غير مُختار
- [x] RPCs: set_application_stage / hire_applicant / unhire_applicant (ذرّية، سحب UPDATE المباشر)
- [x] إقفال الوظيفة تلقائياً عند اكتمال الشواغر + اعتذار لبقية المتقدمين
- [x] شريط «تم اختيار x من y» وفلترة المراحل داخل كل وظيفة
- [x] اختبار حي: تقديم → مراحل → اختيار → إقفال → منع تقديم جديد (JOB_CLOSED)

## المرحلة 11 — مرحلة المقابلة (مكتملة)
- جدول interviews + دوال schedule/respond/reschedule/cancel/complete (SECURITY DEFINER مع تحقق ملكية).
- المنشأة: جدولة/إعادة جدولة/إلغاء/إنهاء بتقييم داخلي داخل بطاقة المتقدم والحجز.
- المرشح: تأكيد الحضور أو الاعتذار من «طلباتي» و«مناوباتي».
- الجدولة تنقل الطلب تلقائياً لمرحلة «مقابلة/عرض»؛ إنهاء المقابلة مع الرفض ينقله لـ«غير مُختار».

## المرحلة 12 — الهوية وتجربة المنتج المتكاملة
- [x] بحث المستخدم والسوق وتدقيق رحلات الضيف والكادر والمنشأة والمشرف.
- [x] تثبيت شعار SyndeoCare الحقيقي وfavicon وخط Cairo ونظام ألوان مشتق من العلامة.
- [x] توحيد الدلالات البصرية للحالات وإصلاح RTL وإمكانية الوصول الأساسية.
- [x] إزالة ازدواج سوق المناوبات من التنقل العام وربطه بصفحة الفرص الموحدة.
- [x] إزالة وجهات الأسعار والاشتراك من رحلة الإطلاق المجاني وتحويل الرابط القديم بأمان.
- [x] جعل «الخطوة التالية» للكادر تفضّل الدعوات والطلبات النشطة قبل اقتراح فرص جديدة.
- [x] تصحيح «المناوبات القادمة» لاستبعاد الحجوزات الملغاة والمواعيد المنتهية.
- [x] توحيد روابط متابعة المناوبات وإزالة صفحة دعوة مختصين اليتيمة دون هدف محدد.
- [x] إصلاح تداخل نوع الفرصة مع نوع التوظيف وجعل «إعادة الضبط» تمسح الحالة كاملة.
- [x] إضافة حالة فشل وإعادة محاولة واضحة لقائمة الرسائل.
- [x] تصحيح اتجاه القوائم والجداول المشتركة في RTL/LTR.
- [x] إعادة ترتيب التسجيل والتهيئة ولوحات الحساب حول الخطوة التالية، مع حفظ مسودات آمن ومنع وميض اتجاه اللغة.
- [x] إظهار الدعوات والمقابلات والطلبات والمناوبات المتأخرة كأولويات حقيقية دون عدادات أو بيانات مصطنعة.
- [x] توحيد حالة بحث الفرص في الرابط واستبعاد الحجوزات الملغاة من المناوبات النشطة.
- [x] إزالة لغة الدفع والترقية من النسخة التجريبية وتحويل رابط الأسعار القديم إلى صفحة المنشآت.
- [x] QA عام وحساب كادر حقيقي على 390px و1280px: التحويلات والتنقل والترتيب بلا امتداد أو أخطاء متصفح، دون تعديل البيانات.
- [ ] QA رحلة المنشأة الكاملة بحساب منشأة مخصص — لا يُختار حساب من الحسابات المتعددة دون تحديد مالكه.

## المرحلة 13 — إغلاق تجربة الاستخدام الشاملة
- [x] توحيد حالات تحميل النشاط والمتقدمين بهياكل ثابتة تمنع قفز المحتوى.
- [x] ترتيب الخطوة التالية للكادر والمنشأة حسب القرار المطلوب فعلاً.
- [x] إضافة إيصال نجاح قابل للتصرف بعد التقديم والحجز مع انتقال مباشر للمتابعة.
- [x] توضيح كشف اسم المنشأة قبل بدء أول محادثة، وتحديث نص الخصوصية بعد كشف الهوية.
- [x] توحيد عدادات الرأس وأهداف اللمس لإجراءات الإشعارات.
- [x] توحيد حالات تحميل الوثائق والتوثيق والحجوزات والتقرير والرسائل وملف المرشح.
- [x] إضافة تأكيد كشف اسم المنشأة قبل بدء المحادثة من حجوزات المناوبات أيضاً.
- [x] QA الضيف بالعربية والإنجليزية للصفحة الرئيسية والفرص وتسجيل المنشأة: بلا امتداد أفقي أو أخطاء متصفح.
- [ ] QA مصادق شامل للمنشأة بعد هذه الجولة — يحتاج تحديد حساب المنشأة المراد اختباره.

## المرحلة 14 — تحسينات التفاعل والوصولية (منفذة)
- زر موحد بحالة انتظار داخلية (`loading`) يمنع النقر المزدوج، وطُبق على كل أزرار الإجراءات.
- `src/lib/undo.ts`: تنبيه نجاح مع «تراجع» خلال 5 ثوانٍ، مطبّق على حفظ/إلغاء حفظ الوظيفة.
- تسميات مسموعة لأزرار الحذف في الوثائق وتوثيق المنشأة والأجهزة، ووصف لشريط التنقل.
- شريط التنقل العلوي على سطح المكتب محدود بخمس وجهات؛ الباقي في التذييل وقائمة الجوال.
- حركة موحدة خفيفة `fade-rise` تحترم تفضيل تقليل الحركة.
- التحقق: typecheck نظيف، build OK، فحص Playwright للصفحات `/`، `/jobs`، `/auth` بلا أخطاء console.

## المرحلة 15 — إتقان التفاصيل (منفذة)
- توحيد حالات الانتظار في صفحة التخصص وتوثيق المنشأة ولوحة الإشراف (هياكل تحميل بدل نص).
- حالة فراغ موحّدة لوثائق الكادر (مع شرح سبب الرفع) ولنتائج البحث عن مرشحين (مع زر مسح كل الفلاتر).
- «تراجع» خلال 5 ثوانٍ عند تفعيل/إيقاف تنبيه الوظائف، إضافة إلى حفظ/إلغاء حفظ الوظيفة.
- التحقق: typecheck نظيف، وفحص متصفح على 320/390/768/1024/1440 لخمس صفحات — بلا تجاوز أفقي وبلا أخطاء console.

## المرحلة 16 — صقل شامل (منفذة)
- قاموس مصطلحات واحد `src/lib/terms.ts`: وظيفة/مناوبة/فرصة، متقدم/مرشح. أُزيلت كلمة «إعلان» من شاشات التطبيق (بقيت في صفحات التسويق فقط).
- مؤشر خطوات ظاهر عند النشر: التفاصيل ← المراجعة ← النشر (`src/components/step-indicator.tsx`).
- مراحل الطلب صار لها أسماء مقروءة تحت شريط التقدم + وصف مسموع للمرحلة الحالية.
- حالة فراغ موحّدة في الرسائل.
- التحقق: typecheck نظيف، فحص متصفح مسجّل الدخول على 390 و1280 لصفحات النشاط والفرص والتفضيلات — بلا تجاوز أفقي ولا أخطاء.
- متبقٍ داخلي (لا أثر للمستخدم): تقسيم ملف لوحة المنشأة 1735 سطراً إلى ملفات أصغر؛ التبويبات تعمل أصلاً.

## المرحلة 17 — مركز حساب واحد ومدخل تسجيل متسق (منفذة)
- صفحة «الإعدادات» صارت مركزاً واحداً بتبويبات: عام / تنبيهات الوظائف / الإشعارات / الأمان (تبويب التنبيهات مخفي لحسابات المنشأة).
- استُخرج `src/components/panels/security.tsx` و`src/components/panels/notifications.tsx`؛ مسارات `/security` و`/notifications` صارت أغلفة رقيقة.
- التقرير الشهري انتقل إلى «نشاطي» (`/activity?tab=report`).
- الروابط القديمة تحوّل للتبويب الصحيح: `/alerts` و`/preferences` → `/settings?tab=alerts`، `/preferences?tab=report` → `/activity?tab=report`.
- صفحة تسجيل المنشأة صار فيها نفس مبدّل نوع الحساب الموجود في صفحة تسجيل الكادر (بدل رابط «رجوع» فقط).
- التحقق: typecheck والبناء نظيفان؛ فحص متصفح مسجّل الدخول وغير مسجّل على 320/390/768/1024/1440 — كل التحويلات صحيحة، بلا تجاوز أفقي ولا أخطاء console.
- متبقٍ داخلي (لا أثر للمستخدم): تقسيم `facility.index.tsx` و`messages.tsx` إلى ملفات أصغر.

## المرحلة 18 — تفكيك الشاشتين الضخمتين وإصلاح تداخل HTML (منفذة)
- استُخرجت نصوص وأنواع ومساعدات لوحة المنشأة إلى `src/components/panels/facility.shared.ts` ونصوص الرسائل إلى `src/components/panels/messages.shared.ts` — بلا أي تغيير في الشكل أو السلوك.
- وُحد شكل الانتظار في لوحة المنشأة باستخدام `Skeleton` بدل نص «جارٍ التحميل».
- أُصلح تداخل HTML غير صالح في بطاقة المقابلة (`<p>` تحتوي `<Badge>`) الذي كان يسبب تحذير hydration في صفحة «نشاطي».
- التحقق: typecheck والبناء نظيفان؛ فحص متصفح مسجّل الدخول على 390 و1280 لثماني صفحات — بلا تجاوز أفقي ولا أخطاء console.

## المرحلة 19 — الشاشة لا تُترك صامتة (منفذة)
- `src/components/error-state.tsx`: حالة خطأ موحّدة (شبكة/جلسة/صلاحية/عام) بزر إعادة محاولة أو تسجيل دخول.
- `src/lib/network.ts` + `src/components/offline-banner.tsx`: شريط انقطاع الاتصال مع إعادة جلب تلقائية عند العودة (في `dashboard-shell` و`page-chrome`).
- ربط `isError`/`refetch` في: dashboard، facility.index، admin، profile، jobs.index، jobs.$jobId، shifts.$shiftId، facilities.$facilityId، facility.candidates.$userId، الصفحة الرئيسية، ولوحات credentials/facility.verification/alerts/invite/security.
- كل استعلامات supabase أصبحت ترمي الخطأ (`if (error) throw error`) بدل ابتلاعه — 37 موضعاً.
- `retry: 1` في QueryClient ليصل المستخدم إلى رسالة واضحة بسرعة.
- `min-h-screen` → `min-h-dvh` في الإطارات الثلاثة، ورمز `--on-hero` بديلاً عن `text-white` في رؤوس الصفحات.

## المرحلة 20 — صقل تجربة الجوال (قيد التنفيذ)
- [x] ضغط الصفحة الرئيسية على الهاتف وإظهار عدد مختصر من أحدث الفرص.
- [x] إعادة ترتيب بطاقة المناوبة وتوحيد فتح تفاصيلها مع بطاقة الوظيفة.
- [x] إصلاح عرض قائمة الإشعارات وأهداف لمس الفلاتر والترويسة عند 320px.
- [x] تكديس عنوان مساحة العمل وإجراءاته وإظهار عنوان الرسائل على الهاتف.
- [x] تحويل فلاتر الفرص إلى لوحة جوال مستقلة وتحسين مؤشرات التبويبات والأسهم ثنائية الاتجاه في الرحلات الأساسية.
- [x] QA بصري ووظيفي للصفحات العامة على 320/390/768/1024/1440 بالعربية والإنجليزية: بلا تمدد أفقي أو أخطاء متصفح.
- [ ] QA المصادق النهائي لمساحة الكادر والمنشأة — جلسة المعاينة المصادقة غير متاحة حالياً؛ التحقق البرمجي والبناء ناجحان.

## المرحلة 21 — تحصين الإنتاج (منفذة)
- قاعدة البيانات تفرض الحقول التي يديرها النظام: صلاحيات على مستوى الأعمدة لملفات الكادر والمنشآت (لا تعديل is_verified/rating من صاحب الحساب)، وحارس يمنع نقل الملكية.
- وثائق الكادر ووثائق المنشآت: مُنع التعديل المباشر من العميل نهائياً (رفع/حذف/اطلاع فقط).
- اشتراك المنشأة للقراءة فقط من العميل؛ الفترة التجريبية واستهلاك عمليات البحث عبر دوال النظام.
- دوال إدارية جديدة SECURITY DEFINER مقفلة بـ has_role: مراجعة وثيقة كادر/منشأة، وتوثيق منشأة/مختص — و`admin.tsx` صار يستخدمها.
- `sync_facility_verification` يعمل الآن على الحذف أيضاً عبر COALESCE(NEW,OLD) دون المساس ببيانات التوثيق الحالية.
- لوحة الكادر: إصلاح استعلام المناوبات (return قبل فحص الخطأ)، فحص خطأ الدعوات، وحالة انتظار تمنع وميض «أكمل ملفك».
- لا تُعرض رسائل أخطاء قاعدة البيانات الخام في لوحة الإدارة؛ تُسجَّل في console وتُعرض رسالة مترجمة.
- اختبارات: صلاحيات الأعمدة، رفض 403 لمحاولات تعديل is_verified/rating/status من مستخدم مسجّل حقيقي، نجاح تعديل الملف العادي، تحديثات النظام الداخلية تعمل، الصفحات العامة وصفحات الكادر بلا أخطاء، والزائر يُحوَّل إلى /auth.

## المرحلة 22 — تحصين الرفع والنماذج العامة (منفذة)
- وثائق الكادر والمنشآت: صلاحيات الإدخال على مستوى الأعمدة — لا يمكن للعميل إرسال حالة الاعتماد أو ملاحظة المراجعة عند الإنشاء.
- الوظائف والمناوبات: الحقول التي يديرها النظام (شارة التوثيق، عدّاد المتقدمين، التمييز، الرابط المختصر، الحاجز) غير قابلة للتعديل من المنشأة؛ حقول الإعلان والحالة تعمل كالمعتاد، والمنشأة تُحدَّد عند الإنشاء فقط.
- رفع الملفات: قاعدة موحّدة للأنواع المسموحة لكل مساحة (الصور الشخصية، الوثائق، مرفقات المحادثة بما فيها الرسائل الصوتية) مفروضة من الخادم + تحقق مترجم قبل الرفع في الواجهة.
- نموذج التواصل: الإدخال المباشر ممنوع، والإرسال عبر دالة محمية مع تحقق ومنع التكرار وحد إرسال لكل بريد؛ صندوق الإدارة كما هو.
- تصحيح نصوص الثقة في «للمنشآت» و«من نحن»: لا ادعاء بأن كل متقدم موثق مسبقاً؛ الشارة تعني اعتماداً فعلياً من الفريق.
- أهداف اللمس 44 بكسل في المراسلة والتسجيل الصوتي ومساحة المنشأة ومركز الحساب وشريط اللوحة.
- اختبارات: صلاحيات الأعمدة، 403 لمحاولات تعديل شارة التوثيق/العدّادات/حالة الوثيقة، 204 لتعديل مسموح، رفض الإدخال المباشر في رسائل التواصل، تحقق الدالة الجديدة، صفحات 320/768/1280 عامة ومصادقة بلا تمدد أو أخطاء متصفح.

## المرحلة 23 — الصقل النهائي والاتساق (منفذة)
- التخزين: ضُبطت أنواع الملفات المسموحة على المساحات الأربع (الصور الشخصية، وثائق الكادر، وثائق المنشآت، مرفقات المحادثة بما فيها الصوت) بما يطابق تحقق الواجهة، مع بقاء حدود الحجم. قيد: أدوات الترحيل ترفض الكتابة على إعدادات المساحات، فنُفّذ عبر واجهة التخزين الإدارية.
- `candidate_search_access`: تفعيل حماية الصفوف مع سياسة لخدمة النظام فقط، دون أي صلاحية للمستخدمين.
- التسجيل (كادر ومنشأة): عبارة الموافقة صارت تحتوي روابط فعلية وواضحة إلى شروط الاستخدام وسياسة الخصوصية بالعربية والإنجليزية.
- حالات غير مكتملة: صفحة التخصصات (تحميل/خطأ/فراغ)، صفحة التخصص الواحد (تمييز «غير موجود» عن فشل التحميل)، وبطاقة «وظائف جديدة» في الإعدادات.
- مُوحِّد رسائل الأخطاء (`src/lib/user-errors.ts`): يحوّل أخطاء الدخول وقاعدة البيانات والرفع إلى نص مفهوم بالعربية/الإنجليزية ويسجّل الأصل تقنياً — مطبَّق على التسجيل والإعداد والملفات والاعتمادات والبحث عن الكفاءات والأمان.
- التنقّل حسب الدور: الإدارة أولاً ثم المنشأة ثم الكادر ثم الإعداد (موحّد مع `resolveLanding`)؛ الحساب الجديد بلا نوع يُسمح له فقط بما يلزم لإكمال الإعداد (الإعداد، الملف، استيراد السيرة، الإعدادات، الرسائل) ويُعاد من غيرها إلى الإعداد.
- اللغة والاتجاه: صفحة «غير موجودة» وشاشة الخطأ ورابط التخطي وشاشة تعذّر التحقق تتبع لغة الواجهة؛ عناوين الحوارات تستخدم `text-start`.
- `/pricing` صار تحويلاً نظيفاً فقط إلى `/for-facilities` (حُذفت ٢٦٠ سطراً من واجهة أسعار غير معروضة) مع بقاء الروابط القديمة تعمل.
- عناوين الصفحات العامة صارت ثنائية اللغة (عربي | English) لتوضيح المحتوى في نتائج البحث.
- README حقيقي للمشروع واسم الحزمة `syndeocare-web`.

### قيود وقرارات مؤجلة
- عناوين/أوصاف ديناميكية لصفحات الوظيفة/المناوبة/المنشأة/التخصص تتطلب تحويل القراءة إلى loaders على مستوى المسار (تغيير بنيوي كبير) — مؤجلة عمداً؛ العناوين الحالية ثنائية اللغة وواضحة.
- لا `canonical` حالياً: لا يوجد مصدر موثوق لنطاق الإنتاج داخل إعداد المشروع.
- الأسعار/الخطط: النسخة تجريبية مجانية، فلا واجهة أسعار ولا دفع.

## المرحلة 24 — إصلاحات ما بعد التحصين (Phase 24)
- حارس المصادقة: فحص الخطأ أولاً؛ غياب الجلسة فقط يحوّل إلى /auth مع حفظ المسار (next)، وأعطال الشبكة تعرض شاشة إعادة المحاولة.
- /auth يقبل next داخلي آمن ويعيد المستخدم إليه بعد الدخول.
- allowlist الحساب بلا دور: /onboarding, /profile, /cv-import, /cv فقط.
- تصحيح ادعاءات التوثيق المطلقة في تسجيل المنشأة والصفحة الرئيسية (ar/en).
- مرفقات المحادثة: تطبيع نوع الملف إلى MIME أساسي (audio/webm;codecs=opus) واستنتاج آمن من الامتداد بدل octet-stream.
- إتاحة أكبر: مساحات ضغط 44 بكسل وaria-label لمشغّل الصوت والسرعة والصور/الفيديو والتنزيل والإغلاق.
- user-errors: UserFacingError + عدم عرض أي رسالة backend غير معروفة خاماً؛ طُبق على change-request/alerts/messages/cv-import/invite/facility.index/candidates/onboarding.
- إعداد buckets: scripts/setup-storage-buckets.mjs قابل لإعادة التشغيل + توثيق في README (القيد: migration runner يمنع الكتابة على storage.buckets).
- تحقق: RLS على candidate_search_access (سياسة واحدة)، لا bucket بلا allowed_mime_types، أعمدة المرحلتين 21/22 ما زالت ممنوعة، صفحات عامة 320/768/1280 بلا تمدد، الزائر إلى /auth، عطل الشبكة لا يسجّل خروجاً، صفحات الكادر تفتح سليمة. لم يُختبر: حساب بلا دور (يتطلب إنشاء بيانات حقيقية).

## Phase 25 — إغلاق نهائي
- Google OAuth يحافظ على `next` الآمن عبر redirect_uri إلى /auth (URL/URLSearchParams + safeNext)، وتسجيل الدخول بكلمة المرور يحافظ عليه أصلاً.
- نصوص الثقة: حذف "verified professional profile" و"توظيف خلال 24-72 ساعة / Hire within 24-72 hours" من التسجيل والتسويق؛ لا ادعاءات مطلقة متبقية.
- تحقق: typecheck/build نظيفان؛ /dashboard و/facility و/messages للزائر تذهب إلى /auth?next=...؛ الصفحات العامة بلا تمدد أو أخطاء console.

## Phase 26 — محاكاة المنتج الكاملة (Full Product Simulation)
تمت محاكاة التجربة فعلياً عبر المتصفح بحسابات اختبار مؤقتة (كادر، منشأة، حساب بلا دور، إدارة)، ثم حُذفت كلها مع بياناتها.

### رحلات اختُبرت فعلياً من البداية للنهاية
- الزائر: 15 صفحة عامة + 404 على 7 مقاسات (320/360/390/430/768/1280/1440) — لا تمدد أفقي ولا أخطاء.
- حساب بلا دور: الدخول يقود إلى شاشة الإعداد.
- الكادر: تسجيل → إعداد ٣ خطوات → لوحة → تصفّح الفرص → التقديم على وظيفة → حجز مناوبة → رفع وثيقة → الرسائل.
- المنشأة: تسجيل → إعداد خطوتين → نشر وظيفة (مراجعة ثم تأكيد) → نشر مناوبة → قائمة المتقدمين → نقل المرحلة → اختيار مرشح → بدء محادثة → بحث المرشحين.
- الإدارة: الدخول ولوحة الإدارة → اعتماد وثيقة كادر عبر الإجراءات الآمنة → ظهور شارة التوثيق.

### إصلاحات نُفّذت
- **شارة توثيق الكوادر لم تكن تُمنح أبداً**: قاعدة المنح في قاعدة البيانات كانت تبحث عن أنواع وثائق قديمة (license/national_id) لا يستخدمها التطبيق. صارت تُمنح عند اعتماد «ترخيص مزاولة المهنة» و«بطاقة الهوية / الجواز» معاً — مطابقة لما تعرضه صفحة الوثائق. نص لوحة الإدارة صُحّح ليطابق القاعدة.
- **زر التقديم/الحجز كان مغطى بشريط الجوال السفلي**: متغيّرات ارتفاع الشريط والمنطقة الآمنة (`--app-bottom-nav` / `--app-safe-bottom`) طُبّقت على كل الأشرطة الثابتة.
- **ادعاء ثقة غير صحيح** في صفحة الوظيفة («كل ناشر تُراجَع اعتماداته قبل النشر») → صيغة دقيقة تشرح متى تُكشف هوية المنشأة وأن حالة التوثيق ظاهرة.
- **رسائل التحقق لم تكن تصل للمستخدم**: ٨ ملفات كانت ترمي أخطاء خام تُستبدل برسالة عامة → صارت `userError` فتظهر الرسالة الصحيحة.
- **أخطاء عرض (hydration)** في قائمة المتقدمين والأمان والدعوات وبحث المرشحين (عنصر داخل فقرة) → أُصلحت؛ الكونسول نظيف.
- **صياغة عربية**: «خبرة 0 سنة / 3 سنة» → «بدون خبرة مسجّلة / خبرة 3 سنوات» في كل الصفحات، ورموز الدول القديمة (YE) تُعرض الآن باسم الدولة.
- تشديد أمني: منع استدعاء دوال المشغّلات الداخلية مباشرة من المتصفح.

### تنظيف
حُذفت حسابات الاختبار (`*@e2e.syndeocare.test`) ومنشأة الاختبار ووظيفتها ومناوبتها وطلباتها وحجوزاتها ومحادثاتها ووثائقها. لم تُمَس أي بيانات حقيقية.

### لم يُختبر (يحتاج خدمات خارجية)
إرسال البريد وواتساب والمهام المجدولة — معطّلة عمداً حتى اعتماد النطاق والاعتمادات.

## Phase 27 — سلامة البيانات + تحصين الرسائل والدعوات
تحويل التعديلات المباشرة على قاعدة البيانات إلى هجرات متتبعة قابلة لإعادة التشغيل، مع تحديث الواجهة والاختبارات.

### قواعد صارت مثبّتة في هجرة
- **الرسائل**: الإرسال يقتصر على النص والمرفق؛ لا يمكن تعديل نص رسالة مُرسلة أو مُرسِلها أو محادثتها. علامتا «تم التسليم» و«تمت القراءة» يضعهما المستلم فقط، ويكتبهما الخادم بوقته، ولا يمكن مسحهما أو تزويرهما بتاريخ قديم.
- **المحادثات**: لا تعديل مباشر من المتصفح؛ آخر نشاط وكشف الهوية يتغيران عبر النظام فقط. (لا يوجد أي تعديل مباشر في الكود.)
- **الدعوات**: المختص يقبل أو يرفض فقط، والمنشأة تسحب الدعوة المعلّقة فقط، والدعوة المحسومة نهائية. عند الإنشاء لا يمكن تحديد الحالة أو وقت الرد. ويصل إشعار للمختص عند سحب الدعوة.
- **الإشعارات**: يمكن تعليمها مقروءة فقط — لا تعديل للنص أو النوع أو الرابط.
- **طلبات تعديل الملف**: تُنشأ معلّقة فقط بحقول محدودة، ولا يعدّلها صاحبها؛ المراجعة عبر الإدارة فقط مع إعادة التحقق من ملكية المنشأة.
- **الأجهزة الموثوقة**: تسجيل الجهاز، وتعديل الاسم وآخر استخدام فقط.

### واجهة
- زر «سحب الدعوة» للمنشأة على كل دعوة معلّقة، مع تأكيد واضح ورسالة نجاح، وتظهر «ملغاة» في قائمة الدعوات المُرسلة، ولا يمكن إعادة دعوة من سُحبت دعوته ضمن نفس الفرصة.
- المختص لا يرى أزرار القبول/الرفض إلا للدعوات المعلّقة (كان كذلك)، ورسائل الأخطاء صارت مفهومة بدل نص عام.

### نتائج الاختبار الفعلية
- صلاحيات الأعمدة: الرسائل (إرسال: المحادثة/المرسل/النص/المرفق — تعديل: القراءة والتسليم فقط)، المحادثات (لا شيء)، الدعوات (إنشاء: المختص والفرصة والرسالة — تعديل: الحالة فقط)، الإشعارات (القراءة فقط)، طلبات التعديل (٨ حقول إنشاء فقط)، الأجهزة الموثوقة — جميعها مطابقة.
- اختبار سلوكي على بيانات تجريبية حُذفت في نفس العملية: طرف خارجي لا يغيّر دعوة؛ المنشأة لا تقبل نيابة عن المختص؛ سحب الدعوة ينجح ويصل الإشعار ويُسجَّل وقت الرد؛ الدعوة المحسومة لا تُعاد للانتظار؛ قبول المختص يفتح المحادثة ويكشف الهوية؛ المرسِل لا يعلّم رسالته مقروءة؛ المستلم يعلّمها والوقت من الخادم ومعه «تم التسليم»؛ ولا يمكن مسح العلامة.
- فحص الواجهة: الصفحات العامة والرسائل والدعوات والإشعارات على 320/360/390/430 — بلا تمدد أفقي ولا أخطاء.
- فحص الأنواع والبناء نظيفان. لم تُنشأ أو تُعدَّل أي بيانات مستخدمين حقيقية.

## Phase 28 — الصلاحيات وثوابت سير العمل وسلامة المنتج
تحويل ما طُبّق مباشرة على قاعدة البيانات إلى هجرة متتبعة، وإغلاق ثغرات الصلاحيات وسير العمل، مع اختبار فعلي عبر المتصفح.

### قواعد صارت مثبّتة في هجرة
- **الأدوار**: بيانات التسجيل الشخصية لم تعد تمنح أي صلاحية. الحساب الجديد بلا دور حتى يكتمل الملف، ثم يُمنح الدور عبر دالة موثوقة فقط. لا يستطيع أحد منح نفسه دوراً.
- **ظهور الفرص**: الزائر يرى فقط الوظائف المفتوحة غير المنتهية والمناوبات المتاحة القادمة. أصحاب العلاقة (المنشأة الناشرة، من تقدّم أو حجز أو دُعي أو راسَل، والإدارة) يظل بإمكانهم رؤية سجلهم كاملاً.
- **بدء المحادثة مع مرشح**: لا يمكن ربطها بوظيفة أو مناوبة لا تخص المنشأة، ولا بأكثر من فرصة واحدة، وطول الموضوع محدود.
- **المقابلات**: مدة بين ١٠ و٢٤٠ دقيقة، المقابلة الحضورية تتطلب عنواناً والمرئية رابطاً صحيحاً، ولا تُجدول على طلب محسوم أو حجز ملغى، ولا يُرد عليها بعد انتهاء وقتها، ولا تُلغى أو تُنهى مرتين.
- **التراجع عن الاختيار**: الوظيفة التي أُقفلت تلقائياً باكتمال الشواغر تُفتح من جديد عند التراجع؛ أما الإغلاق اليدوي فيطلب من المنشأة إعادة الفتح أولاً برسالة واضحة.
- **أقل صلاحية ممكنة**: الزائر لا يستطيع الكتابة في أي جدول؛ والمستخدم المسجّل لا يكتب مباشرة في المقابلات والطلبات والحجوزات والتقييمات وسجلات النظام — كلها عبر عمليات موثوقة. صندوق رسائل التواصل: الإدارة تغيّر حالة المعالجة فقط.

### واجهة
- زر «تراجع عن الاختيار» صار يظهر أيضاً بعد إقفال الوظيفة تلقائياً (كان مخفياً فيصبح التراجع مستحيلاً عملياً).
- المقابلة الحضورية بلا عنوان تُرفض برسالة واضحة قبل الإرسال، ويظهر للمرشح «انتهى وقت هذه المقابلة» بدل أزرار لا تعمل.
- أولوية التوجيه بعد التسجيل موحّدة (إدارة ثم منشأة ثم كادر)، وأخطاء التفعيل صارت مفهومة مع طمأنة بعدم إنشاء ملف مكرر.
- صفحة المنشأة للزائر تعرض «هوية محجوبة» بدل رسالة خطأ.
- «خبرة لا تقل عن 0 سنوات» لم تعد تظهر، وسنوات الخبرة بصياغة عربية سليمة.

### نتائج الاختبار الفعلية (عبر المتصفح)
- رحلة كاملة: منشأة تنشر وظيفة → كادر يتقدّم → جدولة مقابلة (رُفضت الحضورية بلا عنوان، ونجحت المرئية) → المرشح يؤكد الحضور → اختيار المرشح وإقفال الوظيفة تلقائياً → التراجع عن الاختيار وإعادة فتح الوظيفة — كلها نجحت بلا أخطاء.
- الزائر: لا يستطيع الكتابة في أي جدول؛ الوظائف المفتوحة تظهر؛ صفحات عامة على 320/360/390/430/768/1280/1440 بلا تمدد أفقي ولا أخطاء.
- فحص الأنواع والبناء نظيفان.

### تنظيف
حُذفت حسابات وبيانات الاختبار (`qa28.*@e2e.syndeocare.test`) بالكامل. لم تُمَس أي بيانات حقيقية.

### قرار يحتاج اختيارك
صفحة منشأة مستقلة للزائر: حالياً بيانات المنشآت غير مقروءة للزائر (حماية الهوية)، فتظهر الصفحة كـ«هوية محجوبة». الخياران: (أ) إتاحة بيانات عامة للمنشأة (الاسم، النوع، المدينة، الوصف، حالة التوثيق، التقييم) للزائر، أو (ب) إزالة الصفحة نهائياً والاكتفاء بعرض الهوية بعد بدء التعامل.

## Phase 29 — تعيين أول مسؤول + سلامة البيانات القديمة + بوابة الإطلاق

### تنظيف السجلات اليتيمة
- دالة تنظيف قابلة لإعادة التشغيل (من جهة النظام الموثوقة فقط): تحذف الصلاحيات والإشعارات والأجهزة التابعة لحسابات محذوفة، وتخفي ملفات الكوادر اليتيمة عن البحث، ولا تحذف أي ملف مرتبط بسجل عمل (طلب، حجز، تقييم، محادثة، رسالة، دعوة).
- نتيجة التشغيل الفعلي: حُذف ١٤ إشعاراً و١٢ ملفاً و٣ ملفات كوادر يتيمة؛ بقي ملف واحد مرتبط بمحادثة حقيقية وهو مخفي عن البحث. لا صلاحيات يتيمة.
- المنشآت بلا مالك (٦) مقصودة كإدراج عام، ومميّزة في التقرير كمعلومة لا كخطأ.

### تعيين المسؤول بأمان
- لا يوجد أي مسار يمنح المستخدم صلاحية الإدارة بنفسه، ولا اعتماد على البريد أو بيانات التسجيل.
- أول مسؤول يُعيَّن فقط من جهة النظام الموثوقة (خطوة موثّقة في README).
- بعد ذلك يستطيع مسؤول قائم إضافة أو سحب صلاحية مسؤول آخر، مع منع سحب صلاحية النفس أو إزالة آخر مسؤول.

### بوابة الإطلاق
- تبويب جديد في لوحة الإدارة: «جاهزية الإطلاق» يعرض عدد المسؤولين الفعليين، والسجلات اليتيمة، وعدم تطابق الصلاحيات مع الملفات، والمنشآت بلا مالك، وحسابات الاختبار المتبقية.

### الأداء
- فهارس مبرّرة فقط: الوظائف (المنشأة، التخصص، القائمة العامة)، المناوبات (المنشأة، التخصص، الحالة+البداية)، الطلبات والحجوزات حسب المستخدم، المحفوظات حسب الوظيفة، تنبيهات التخصص النشطة، التقييمات، الوثائق حسب المالك والحالة، بحث الكوادر، وطلبات التعديل. لا فهارس مكررة.

### الحالة الحالية
- لا حسابات أو بيانات اختبار (`*@e2e.syndeocare.test`) متبقية. فحص الأنواع والبناء نظيفان.

### 🚩 مانع إطلاق واحد متبقٍ
**لا يوجد حالياً أي حساب إدارة فعّال (0).** هذا الإجراء الوحيد الذي يحتاج قرارك: اختر الحساب الذي سيكون أول مسؤول، ويُعيَّن عندها عبر الإجراء الموثوق المذكور في README. لن يُمنح لأي حساب تلقائياً.

## Phase 30 — Visual product design & mobile UX acceptance (done)
Screens audited by screenshot at 390x844 and 1440x900 (public, professional, facility, admin) plus a 7-viewport AR/EN sweep.

Changes:
- `_public.index.tsx` — hero search bar no longer clipped on desktop (removed half-overlap positioning); section spacing rebalanced.
- `i18n.tsx` — home search CTA is now "ابحث / Search" (was a duplicate of "تصفح الوظائف").
- `_public.jobs.index.tsx` — badge no longer claims all employers are verified.
- `_public.auth.tsx` — sign-in form is first on phones; marketing panel is desktop-only.
- `dashboard.tsx` (professional) — quick-access no longer repeats the current "next step" destination.
- `profile.tsx` — page heading now sits above the tab bar; tab panel keeps only its action.
- `admin.tsx` — stat cards are 2-up on phones instead of one tall column.
- `panels/facility.verification.tsx`, `panels/credentials.tsx` — removed the 24–48h review-time promise; copy now describes the "Under review" state.

Verified: 7 viewports x AR/EN on public routes — no horizontal overflow, no console errors; professional/facility/admin screens at 390 and 1440 clean; typecheck and build clean. QA fixtures (2 accounts + profiles + temporary admin role) created and fully deleted.

## Phase 31 — OAuth onboarding + release acceptance gate (done)
- Google sign-up on `/register` and `/register/employer` now returns to `/auth?next=/onboarding` (fixed internal path, no user-supplied redirect) instead of the home page, so the callback always reaches onboarding. `sc_signup_intent` still selects the professional/facility flow; `/auth` keeps the Phase 25 safe-`next` handling.
- Invitations: repo migration now ends with `REVOKE INSERT ON public.invitations FROM authenticated` (and anon); creation goes only through `send_candidate_invitation`, client keeps SELECT/DELETE + UPDATE(status).

Acceptance tested this pass:
- Typecheck and build clean.
- OAuth callback logic: roleless + professional intent -> professional onboarding (3 steps); roleless + facility intent -> facility onboarding (2 steps); user with an existing role -> /dashboard with no loop; `next=//evil.com` rejected.
- 10 public routes x 7 viewports (320/360/390/430/768/1280/1440) x AR/EN: no horizontal overflow, no console errors.
- DB matches migrations: invitations have no client INSERT, messages limited to body/attachment insert + read/delivered update, jobs/shifts visibility policies present (5 each), all 12 workflow/admin RPCs present.
- QA fixtures: 2 temporary accounts created and deleted; 0 `*@e2e.syndeocare.test` users, 0 orphan roles, 0 QA rows remain.

Release state: NOT published (no automatic publish).
🚩 Single release blocker: live admin count = 0. The project owner must choose the first real admin account; it is then granted through `bootstrap_admin_role` from the trusted server context (see README). No account is assigned automatically.
External dependencies still unavailable: transactional email and WhatsApp delivery (credentials/domain approval pending) — the product surfaces these as unavailable rather than pretending they send.

## Phase 32 — migration parity repair (done)
- Tracked idempotent migration grants `USAGE ON SCHEMA private` + `EXECUTE` on `private.can_read_job_row` / `private.can_read_shift_row` to `authenticated` only; anon explicitly revoked. Fixes the Phase 28 regression where authenticated jobs/shifts SELECT returned 42501.
- Verified live: authenticated reads jobs/shifts with no permission errors; anon sees only open/active rows (closed/history empty) and cannot call the helpers (private schema not exposed). Helpers are STABLE SECURITY DEFINER with empty search_path — no RLS recursion. Closed rows visible to the test account only via its real engagements (applications/invitations), as designed.

## Phase 33 — interview completion time invariant (done)
- Tracked migration mirrors the live hotfix: `complete_interview` raises `INTERVIEW_NOT_STARTED` when `scheduled_at > now()`. UI hides the "finish & rate" button until the scheduled time passes; AR/EN error copy added for race/time-drift. Completion stays available for scheduled/confirmed after the time, per existing policy. Verified: live function contains the guard, RPC callable by authenticated without permission errors (guard ordering returns INTERVIEW_NOT_FOUND for unknown ids), typecheck/build clean.

## Phase 34 — revoke non-client table privileges (done)
- Tracked idempotent migration loops over every public base table revoking TRUNCATE/REFERENCES/TRIGGER from anon + authenticated (SELECT/INSERT/UPDATE/DELETE untouched). Verified via information_schema.role_table_grants: zero remaining rows for those privileges. Build clean.

## Phase 35 — change request canonicalization & attachment ownership (done)
- Tracked idempotent migration for BEFORE INSERT trigger `normalize_profile_change_request()`: derives `old_value` server-side from profiles/healthcare_professionals/facilities per target+field, enforces user_id=auth.uid(), facility ownership, facility_id/target coherence, an unchanged field allowlist, and `attachment_path` starting with `auth.uid()/`; EXECUTE revoked from anon/authenticated. Admin review reads only DB-derived old_value. UI unchanged functionally; added AR/EN messages for INVALID_ATTACHMENT_PATH and INVALID_REQUEST_TARGET.

## Phase 36 — review privacy hardening (done)
- Tracked idempotent migration: dropped public `public read facility reviews`; SELECT on pro_to_facility reviews is authenticated-only and limited to the reviewed professional, the author, the owning facility, or admin (facility_to_pro policy untouched; rating_avg/rating_count logic unchanged).
- Role-simulation test: anon 0 rows, professional 3, facility owner 1 (own facility only), unrelated authenticated 0. No admin account exists yet (existing release blocker), so the admin branch is verified by policy expression only.
- No public UI reads individual reviews: public facility page uses the aggregate columns; review-dialog and facility candidate detail are authenticated-only. Build/typecheck clean.

## Phase 37 — hide unreleased pricing from anonymous users (done)
- Tracked idempotent migration: dropped `plans public read`; SELECT on `public.subscription_plans` is authenticated-only (`plans authenticated read`), `REVOKE SELECT ... FROM anon`. Plan rows and prices unchanged (trial/basic/pro intact).
- Verified: anon gets 42501 permission denied; authenticated reads all 3 plans. All UI usages of subscription_plans live under `_authenticated` (facility plan/quota screens) — no public page depends on the table. `/pricing` is a redirect to `/for-facilities` (no pricing UI in the trial launch). Build/typecheck clean.

## Phase 38 — interview mode-specific UX/data parity (done)
- Tracked idempotent migration for `schedule_interview` matching the live hotfix: `video` requires `meeting_url` matching `^https?://` and forces `location=NULL`; `onsite` requires `location` and forces `meeting_url=NULL`; `phone` nulls both server-side. All other validation/state logic (time, duration, lengths, target, ownership, duplicate check, application status bump, notification) unchanged. EXECUTE stays authenticated-only.
- `src/components/interview.tsx`: format select now clears the field that no longer applies; only `video` shows the Meeting link field (Required, type=url, https placeholder) and only `onsite` shows the Address field (Required); `phone` shows an explanatory note that the candidate is called on the phone number in their account. Submit blocks empty/invalid link for video and empty address for onsite, and the RPC payload only sends the field matching the mode.
- Added AR/EN mappings for INTERVIEW_URL_REQUIRED and a clearer INTERVIEW_URL_INVALID (alongside existing INTERVIEW_LOCATION_REQUIRED).
- DB test of all three modes: video without link → INTERVIEW_URL_REQUIRED; video with non-http link → INTERVIEW_URL_INVALID; onsite without address → INTERVIEW_LOCATION_REQUIRED; valid phone/video/onsite payloads pass validation. Build/typecheck clean; dialog has no overflow at 320/390 in AR and EN.

## Phase 39 — avatar/storage identity privacy hardening (done)
- Tracked idempotent migration matching the live hotfix: `public.can_read_avatar_path(text, uuid)` (STABLE SECURITY DEFINER, `search_path=public`, EXECUTE revoked from PUBLIC/anon, granted to authenticated + service_role); dropped `avatars read all`; recreated `avatars read authorized` on `storage.objects` as SELECT TO authenticated with `bucket_id='avatars' AND public.can_read_avatar_path(foldername[1], auth.uid())`. Owner/insert/update/delete policies untouched.
- Visibility semantics: owner; admin; professional → facility logo only after identity reveal (revealed conversation, application in shortlisted/interview/offer/hired, or confirmed booking); facility → professional avatar only after direct engagement (application to its job, booking on its shift, or existing conversation). Candidate-search results and pending invitations stay avatar-less.
- Verified against live data (5 avatar objects): anon-visible 0, stranger-visible 0, owner sees own 5/5, facility-sees-applicant true, professional-sees-revealed-facility true, professional-sees-unrevealed-facility false. Admin branch unverified (no admin account exists — standing release blocker).
- `src/lib/storage.ts`: signed-URL resolution now fails soft (returns null, `retry:false`) so unauthorized viewers and guests render the existing neutral icon/initial fallback instead of a storage error; no error text, no leaked path.
- No public marketing screen restored to a public policy: the guest facility page already hides identity and falls back to the brand icon. No professional UUIDs or storage paths rendered in public UI.
- Guest sweep of the public facility page at 320/390/1440: no horizontal overflow, zero broken images. Build/typecheck clean.

## Phase 40 — owned media path integrity (done)
- Tracked idempotent migration matching the live hotfix: `public.guard_owned_media_path()` (plpgsql, `search_path=public`, EXECUTE revoked from PUBLIC/anon/authenticated) with BEFORE INSERT OR UPDATE OF triggers on `profiles.avatar_url`, `healthcare_professionals.avatar_url`, `facilities.logo_url`.
- Rule: NULL/empty allowed; otherwise the value must start with the owning user's UUID + `/`. Any `http(s)://` value or owner mismatch raises `INVALID_MEDIA_PATH`. Remote image URLs stay unsupported — a future Google avatar would be imported/proxied into Storage, never stored as a tracking URL.
- Upload flows unchanged: `uploadImage()` writes `${userId}/${prefix}-${ts}.${ext}` in the private avatars bucket, so profile avatars and facility logos satisfy the trigger as-is.
- `src/lib/user-errors.ts`: friendly AR/EN mapping for `INVALID_MEDIA_PATH` in case of a race or manual call, so no raw Postgres error reaches the UI.
- Verified: existing rows all compatible; authenticated update to `https://example.com/tracker.png` rejected; trigger function not executable by anon/authenticated. Typecheck/build clean.

## Phase 41 — facility website URL safety + normalization (done)
- Tracked idempotent migration matching the live hotfix: `public.normalize_facility_website()` (plpgsql, `search_path=public`, EXECUTE revoked from PUBLIC/anon/authenticated) with a BEFORE INSERT OR UPDATE OF `website` trigger on `public.facilities`.
- Rules: blank → NULL; >300 chars → `WEBSITE_TOO_LONG`; explicit non-HTTP scheme (`javascript:`, `data:`, …) → `WEBSITE_INVALID`; bare domain → prefixed with `https://`; any remaining non `https?://<no-whitespace>` form → `WEBSITE_INVALID`.
- UI: facility profile and facility onboarding website inputs now use `inputMode="url"`, `maxLength={300}`, an `example.com` placeholder, and an AR/EN hint (linked via `aria-describedby`) stating a bare domain is saved as https.
- `src/lib/user-errors.ts`: friendly AR/EN mappings for `WEBSITE_INVALID` and `WEBSITE_TOO_LONG`; no raw Postgres error surfaces.
- After save, the facility query is invalidated and the form re-syncs from the row, so the normalized `https://…` value is what the user sees.
- Both website links (public facility page and facility profile) render with `target="_blank"` and `rel="noopener noreferrer"`.

## Phase 42 — candidate-search avatar anonymity correction (done)
- Corrects Phase 39: candidate search is intentionally anonymous (no name, no photo before contact), so `candidate_search_access` and `invitations` must NOT grant Storage avatar access.
- Tracked idempotent migration now mirrors the narrower live `public.can_read_avatar_path(text, uuid)` (plpgsql, STABLE SECURITY DEFINER, `search_path=public`, EXECUTE to `authenticated`/`service_role` only, revoked from PUBLIC/anon):
  - owner and admin: unchanged.
  - professional → facility logo: only after conversation `identity_revealed`, application status shortlisted/interview/offer/hired, or a confirmed shift booking.
  - facility → professional avatar: only on direct engagement — application to one of its jobs, booking on one of its shifts, or an existing conversation.
  - candidate search access rows and invitations (pending or otherwise) no longer appear in any branch.
- Verified with rollback-only transactions on live data: search access + pending invitation → `can_read_avatar_path` = false; after a conversation row exists → true. No QA rows persisted.
- Candidate search cards unchanged: still no `full_name` and no avatar; the `/facility/candidates/$userId` full profile stays engagement-gated by RLS.

## Phase 43 — candidate-search content anonymity (done)
- Free-text fields could leak identity: `headline`/`bio` are user-authored and could contain a name, phone, or employer, defeating the anonymous search design.
- Tracked idempotent migration mirrors the live hotfix for `public.search_candidates_idempotent(uuid, uuid, text, text, integer, integer)`: same return signature for compatibility, but `headline` and `bio` are always `NULL` in the fresh response, in the cached (`candidate_search_requests.result`) payload, and in the replayed cached response.
- Grants: `search_candidates_idempotent` → `authenticated` + `service_role`; legacy `search_candidates_atomic` → `service_role` only (EXECUTE revoked from `authenticated`/`anon`; the UI uses the idempotent RPC).
- UI (`facility.candidates.tsx`): the result card is deliberately anonymous — specialty, verified badge, experience, city/country, open-to-shifts, plus an AR/EN note that name, photo and bio appear after the conversation starts. No `—` placeholder, no bio block, no name/avatar/license/contact.
- Full candidate profile after `start_candidate_conversation` (or application/booking engagement) is unchanged and still RLS-gated.
- Verified on live data in rollback-only transactions: fresh search and a repeated identical `request_id` both return zero non-null `headline`/`bio`; the repeat replays the cache and the search quota increments exactly once; stored cache rows contain no free text.
- Visual: 390 and 1280 checks ran signed in, but the available test account has no facility role, so the facility-only screen redirected to the dashboard — card layout change verified by code review and clean typecheck/build only.
- Data migration (idempotent, tracked): existing `candidate_search_requests.result` caches were sanitized — `headline`/`bio` nulled inside every cached array element; 9/9 requests affected, 0 remain with PII. No `request_id`/`completed_at` deleted and `searches_used` untouched. Verified: 9 total cached requests, 0 with non-null `headline`/`bio`.
- Orphan-auth hardening (tracked): the fresh candidate query now `JOIN auth.users au ON au.id = h.user_id`, so a professional whose auth account was deleted never appears in candidate search, even before orphan cleanup runs. Business history (applications, bookings, reviews, conversations) is untouched. Verified in a rollback-only transaction: a temporary `is_searchable` professional with no `auth.users` row returned `orphan_in_results: 0` while a real profile still appeared; quota incremented exactly once (8→9) and rolled back.

## Phase 44 — AI CV parsing abuse/cost protection (done)
- Finding: `parseCv` required auth but had no server-side usage limit, so an authenticated client could loop it and burn AI credits.
- Idempotent migration: table `public.ai_usage_events` (user_id, feature, created_at + index), RLS enabled with **no policies**, all privileges revoked from PUBLIC/anon/authenticated, `service_role` only. Not readable or writable by clients.
- Trusted RPC `public.consume_ai_quota(text)` (plpgsql, SECURITY DEFINER, `search_path=public`, EXECUTE to authenticated+service_role, revoked from PUBLIC/anon): uses `auth.uid()`, takes a per-user/per-feature `pg_advisory_xact_lock` so counting+insert is atomic, enforces **5/hour and 20/day** (constants declared at the top of the function for easy tuning), returns `{allowed, scope, retry_after_seconds, remaining_hour, remaining_day}`. Raises `NOT_AUTHENTICATED` when unauthenticated and `UNKNOWN_AI_FEATURE` for a feature outside the allowlist.
- `src/lib/cv.functions.ts`: consumes quota via `context.supabase.rpc('consume_ai_quota')` **before** calling the AI gateway, so provider failures still count; zod validation failures happen earlier and don't. On limit it returns the stable `AI_RATE_LIMIT` code plus `retryAfterSeconds` — never a raw DB error (a DB error maps to `AI_UNAVAILABLE`).
- Model output bounds: `years_experience` clamped to 0–60 (finite numbers only); every text field whitespace-collapsed and length-capped (name 120, headline 160, country/city/license 60, specialty 80, bio 1000). Input cap stays 20k chars.
- UI (`cv-import.tsx`): AR/EN cooldown toast with minutes/hours remaining, stating the pasted text is preserved; the textarea and any extracted result stay untouched on failure.
- No secret exposure: `LOVABLE_API_KEY` stays server-side, no service-role client added, `requireSupabaseAuth` middleware unchanged.
- Verified in rollback-only transactions: same user gets 5 allowed then `allowed:false scope:hour`; a second user is unaffected (`remaining_hour: 4`); anon has no EXECUTE on the RPC; neither anon nor authenticated can read or write `ai_usage_events`. No real AI calls made.

## Phase 45 — message payload & reaction server validation (done)
- Finding: the composer capped body at 2000 chars and attachments at 10MB, but the database trusted the client. Payload integrity only — no message rate limiting in this phase.
- Idempotent migration mirroring the live hotfix:
  - `public.validate_message_insert()` (plpgsql, `search_path=public`) on `BEFORE INSERT ON public.messages`: body coalesced to `''` and capped at 2000 (`MESSAGE_TOO_LONG`); with no attachment the trimmed body must be non-empty (`MESSAGE_EMPTY`) and attachment name/type/size are forced to NULL; with an attachment the path must start with `${conversation_id}/` (`INVALID_ATTACHMENT_PATH`) and be ≤1024 (`ATTACHMENT_PATH_TOO_LONG`), name non-empty ≤255 (`INVALID_ATTACHMENT_NAME`), type non-empty ≤150 (`INVALID_ATTACHMENT_TYPE`), size >0 and ≤10485760 (`INVALID_ATTACHMENT_SIZE`).
  - `public.validate_message_reaction()` on `BEFORE INSERT OR UPDATE OF emoji ON public.message_reactions`: trimmed, non-empty, ≤16 chars, else `INVALID_REACTION`.
  - Both trigger functions: EXECUTE revoked from PUBLIC/anon/authenticated, granted to `service_role` only.
  - Phase 27's `trg_guard_message_receipts` (BEFORE UPDATE) is re-declared unchanged and coexists with the new BEFORE INSERT trigger.
- `src/lib/user-errors.ts`: AR/EN friendly mappings for `MESSAGE_TOO_LONG`, `MESSAGE_EMPTY`, `INVALID_ATTACHMENT_PATH`, `ATTACHMENT_PATH_TOO_LONG`, `INVALID_ATTACHMENT_NAME`, `INVALID_ATTACHMENT_TYPE`, `INVALID_ATTACHMENT_SIZE`, `INVALID_REACTION`; the send mutation already routes through `friendlyError`, so no raw Postgres text reaches the chat.
- `messages.tsx` send path now stores the base MIME (`baseMime(upload)`, stripping `;codecs=…` from voice notes) and truncates the file name to 255 chars, matching the DB constraints and the bucket's allowed base types.
- Verified in rollback-only transactions: valid text / image / document / voice-note inserts succeed; 2001-char body → `MESSAGE_TOO_LONG`; blank body → `MESSAGE_EMPTY`; foreign-conversation path, 256-char name, blank type, 10MB+1 size each rejected with their codes; attachment metadata auto-cleared on a plain text message; reaction add/remove succeed while a 17-emoji and a blank emoji are rejected. Receipt update by the recipient still works (read_at + delivered_at set) and the sender is still blocked with `MESSAGE_RECEIPT_FORBIDDEN`.
- Mobile sweep at 320/390 (AR): conversation list, thread, bubbles, reactions, attachment/voice controls and the composer render with zero horizontal overflow and no keyboard overlap.

## Phase 46 — preserve recruitment history on listing deletion (done)
- Finding: owners can DELETE their own jobs/shifts directly, and existing FKs cascade into applications, shift_bookings, interviews and invitations — a modified client could erase real hiring history.
- Idempotent migration mirroring the live hotfix: `public.guard_listing_history_delete()` (plpgsql, `search_path=public`) on `BEFORE DELETE` of `public.jobs` (`trg_guard_job_history_delete`) and `public.shifts` (`trg_guard_shift_history_delete`).
  - Job blocked with `JOB_HAS_HISTORY` when any application, invitation, conversation, interview or review references it.
  - Shift blocked with `SHIFT_HAS_HISTORY` when any booking, invitation, conversation, interview or review references it.
  - Listings with no human interaction stay deletable (saved_jobs / job-alert style rows are not business history and may cascade).
  - EXECUTE revoked from PUBLIC/anon/authenticated, granted to `service_role` only.
- Historical FK cascades intentionally left unchanged; the trigger is the safety gate. No existing data touched or removed.
- `src/lib/user-errors.ts`: AR/EN friendly mappings telling the facility to close the job / cancel the shift instead of deleting it. No UI delete action exists for jobs or shifts today (only documents, credentials, alerts, saved jobs, devices, reactions), so no destructive-confirm dialog was added; the mapping is in place for whenever a delete action ships.
- Verified in a rollback-only transaction: a pristine job and a pristine shift delete cleanly; a job with applications is blocked with `JOB_HAS_HISTORY`; a shift with bookings is blocked with `SHIFT_HAS_HISTORY`. Owner-only DELETE RLS policies on jobs/shifts confirmed intact, and the trigger function is not callable by anon/authenticated.

## Phase 47 — self-scope public authorization helpers (requested as "Phase 44"; done)
- Finding: `has_role`, `can_view_facility_identity` and `is_conversation_participant` were SECURITY DEFINER, authenticated-executable and accepted any user's UUID — a privacy enumeration surface even though every policy/RPC passes `auth.uid()`.
- Idempotent migration mirroring the live hotfix: each function now requires `(SELECT auth.uid()) IS NOT NULL AND _user_id = (SELECT auth.uid())` before any lookup; STABLE SECURITY DEFINER, `search_path=public`; EXECUTE revoked from PUBLIC/anon and granted to `authenticated, service_role` only.
- Call-site audit: all 20+ RLS policies (incl. storage.objects), all 17 referencing functions/triggers (`admin_*`, `review_change_request`, `lock_verified_*`, `guard_message_receipts`, `submit_job_application`, `book_open_shift`, `on_invitation_response`, `validate_*_insert`, reports) pass `auth.uid()`. No client code calls these helpers directly. No trusted cross-user use found, so no private helper was needed.
- Regression (rollback-only transaction, real data): self role `true`, other-user role `false`, self conversation participant `true`, other-user participant `false`, other-user facility identity `false`; anon execution denied (42501). Authenticated reads intact: jobs 17, shifts 1, facilities 5, own roles 1, message read path unchanged.
- Linter: no new findings (the single anon-executable SECURITY DEFINER is the intentional guest `submit_contact_message`). typecheck and build clean.

## Phase 48 — alert delivery reliability + email safety + canonical links (requested as "Phase 45"; done)
- Idempotent migration mirroring the live DB prep: `alert_deliveries.attempt_count integer NOT NULL DEFAULT 1`, `last_attempt_at timestamptz NOT NULL DEFAULT now()`, unique partial index `alert_deliveries_shift_unique (alert_id, shift_id, channel) WHERE shift_id IS NOT NULL`, retry index `(status, last_attempt_at) WHERE status <> 'sent'`.
- `src/lib/alerts-dispatch.server.ts` rewritten around one logical row per (alert, listing, channel):
  - only `status='sent'` is permanent; `not_configured` retries as soon as the channel is configured; `failed` retries with bounded policy (`MAX_ATTEMPTS = 5`, `RETRY_INTERVAL_MS = 15 min`).
  - retries UPDATE the existing row (status/error/recipient/attempt_count/last_attempt_at, plus sent_at on success); only the first attempt INSERTs — jobs and shifts both.
  - `job_alerts.last_sent_at` now advances only when at least one message was actually sent.
  - exported pure helpers `shouldAttempt`, `escapeHtml`, `safeHref`, `html`, `jobUrl`, `shiftUrl`, `siteUrl` for testability.
- HTML safety: `escapeHtml()` applied to subject/text; `safeHref()` only emits absolute http(s) URLs (anything else falls back to the site root). Plaintext body stays unescaped. No raw listing field reaches HTML.
- Canonical URLs: `PUBLIC_SITE_URL` normalized with trailing slashes stripped; fallback is `https://syndeocare.ai` (medmatch-plus removed). Job links prefer `slug` and fall back to id; shift links go to `/shifts/<id>`.
- WhatsApp: proactive alerts require an approved template — `alertChannelStatus()` reports WhatsApp ready only with `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_TEMPLATE_NAME`, and `sendWhatsApp({ requireTemplate: true })` returns `not_configured` without one. `getChannelStatus` now surfaces this alert-specific readiness. Secrets stay server-only.
- Tests (provider calls never made; run outside the app tree at /tmp/qa-alerts, 9/9 pass): sent -> skipped; not_configured -> skipped while unconfigured, retried once configured; failed -> skipped inside backoff, retried after 15 min, stopped at 5 attempts; `<img src=x onerror=...>` title renders escaped with no raw attribute; `javascript:` href rejected; fallback/normalized site URL and slug/shift links verified. DB duplicate test in a rolled-back transaction: a second row for the same (alert, shift, channel) is rejected by the unique index; no QA rows remain (alerts 0, deliveries 0).

## Phase 49 — OAuth sign-in callback + real password recovery flow (requested as "Phase 46"; done)
- Google sign-in: `GoogleButton` on `/auth` now always returns to the auth page so `resolveLanding` runs. Default `redirect_uri = ${origin}/auth`; a safe internal `next` is preserved as `${origin}/auth?next=<path>`; external/absolute `next` values are dropped (no open redirect).
- New public route `src/routes/_public.reset-password.tsx` (`/reset-password`, noindex, not guest-only so it never auto-redirects):
  - phases `checking → ready | invalid | done`; link params read from both search and hash (`code`, `token_hash`, `type`, `error`).
  - `token_hash` path verifies via `supabase.auth.verifyOtp({ type: 'recovery', token_hash })`; `code` path waits for the PKCE exchange to produce a session (polling, bounded).
  - form: new password + confirm, show/hide toggles, min 8 / max 72, inline human mismatch and length messages, loading + disabled states.
  - submit calls `supabase.auth.updateUser({ password })`, then signs the recovery session out and shows a success state with a "go to sign in" CTA. Success is kept in `sessionStorage` so the sign-out-triggered router invalidation cannot revert the screen; a fresh recovery link clears it.
  - invalid/expired links show a clear state with "request a new link" / "back to sign in" and never a raw backend error.
- Forgot password on `/auth`: `resetPasswordForEmail(..., { redirectTo: ${origin}/reset-password })`, button disabled while sending, and one identical generic message on success or failure so account existence is never disclosed.
- Recovery UI is session-independent: without valid recovery params the page never renders the password form, so a normal signed-in visitor cannot silently change a password through it.
- Tests (no real email sent; Supabase auth endpoints mocked at the network layer): valid recovery link -> form renders, mismatch and short-password messages correct, `updateUser` called with the new password, success screen shown. No params / `error=access_denied&error_code=otp_expired` / bogus `code` -> invalid state. Google button navigation verified live: no `next` -> `redirect_uri=/auth`; `next=/dashboard` -> preserved; `next=https://evil.com` -> stripped to `/auth`. Mobile 320/390 with zero horizontal overflow and no console errors. typecheck clean.

## Phase 47 — Public listing data surface / publisher identity privacy (done)
- Sanitized browsing surface: `public.public_jobs` and `public.public_shifts` views with explicit column lists, fixed row filters (jobs: `is_active AND (expires_at IS NULL OR expires_at > now())`; shifts: `status = 'open' AND starts_at > now()`) and flattened specialty names. No `publisher_name`, no `auto_closed`, no `booked_by`, no owner/contact data.
- `GRANT SELECT` on both views to anon/authenticated/service_role; dropped the "jobs public read" / "shifts public read" policies and revoked `SELECT` on `public.jobs` / `public.shifts` from anon.
- `private.can_read_job_row` / `can_read_shift_row` no longer contain the "any open listing" clause: base-table reads are admin, facility owner, or engaged users only (applications, saved_jobs, shift_bookings, invitations, conversations).
- Client: new `src/lib/public-listings.ts` holds the column allowlists, `withSpecialty` mapping and typed rows. Home, `/jobs`, specialty pages, dashboard recommendations, settings alert-preview and the public facility page now read from the views. Detail routes dropped `select('*')`: they read the sanitized view first and only fall back to an explicit-column base-table read (closed/booked listings for owner/admin/engaged).
- `publisher_name` is no longer rendered anywhere in the public job UI and its copy strings were removed; legacy values in the table were left untouched.
- Tests: anon REST on `jobs`/`shifts` -> 42501 permission denied; `public_jobs.publisher_name` and `public_shifts.booked_by` -> column does not exist; sanitized reads return the 15 open jobs. Hidden-identity block shows no name/logo/website before reveal; revealed facility still comes through the authorized `facilities` policy. Guest sweep at 390/1280 on `/`, `/jobs`, `/specialties` and job detail: no horizontal overflow, no console errors. typecheck clean.

## Phase 48 — shift state invariants + review-after-completion (done)
- `enforce_shift_status_transition()` (migration now matches live): open→booked requires `booked_by` + matching confirmed booking; open→cancelled blocked while a confirmed booking/booked_by exists (`SHIFT_HAS_ACTIVE_BOOKING`); booked→open only after the booking is gone; booked→completed only after `ends_at <= now()` with a matching confirmed booking; cancelled/completed stay final.
- `has_engagement()` + `save_engagement_review()`: shift engagement requires `booking.status='confirmed' AND shift.status='completed'`; job hired engagement unchanged; legacy reviews untouched.
- New trusted RPC `cancel_facility_shift(_shift_id, _reason?)`: locks the shift, owner check, deletes the booking coherently, sets cancelled, notifies the professional, idempotent; anon execute revoked.
- UI: facility shift cancel now calls the RPC (no direct status write); booked shifts get a distinct confirmation warning; complete action still only after end; `my-shifts` review dialog requires a completed shift.
- Friendly errors: `SHIFT_HAS_ACTIVE_BOOKING`, `SHIFT_BOOKING_INVARIANT`, `INVALID_SHIFT_ENGAGEMENT`, `ENGAGEMENT_REQUIRED`, `SHIFT_NOT_FOUND`, `FORBIDDEN`; `shiftErrorText` no longer falls back to the raw backend message.
- Verified on live DB with a rolled-back QA shift: manual open→booked = SHIFT_BOOKING_INVARIANT, premature complete = blocked, clean open→cancelled = allowed. Typecheck and build clean.

## Phase 49 — signup data continuity + data minimization (done)
- `handle_new_user()` (idempotent migration): stores trimmed `full_name` (max 100) and a sanitized phone (digits + optional leading `+`, 7–15 digits, else NULL) into `profiles`; no arbitrary metadata keys copied, no role derived from metadata.
- Safe backfill (data-only): 3 live profiles with `phone IS NULL` received their signup phone; existing phone values were never overwritten.
- Onboarding prefill: `FacilitySteps` seeds name/type/country/city from signup metadata as initial defaults only (validated type against the known list, trimmed/length-capped); a saved local draft still wins, and existing-facility users are redirected before the form. Professional name prefill unchanged; phone is no longer asked twice.
- Data minimization: gender removed from professional registration UI and metadata (no schema added). Employer governorate stays a UI-only helper for city selection and is no longer sent as permanent metadata.
- Phone UX: neutral placeholder (`771234567` / `+967771234567`), shared `normalizePhone`/`isValidPhone` used by both forms; phone stays private account data, never part of public candidate/facility identity.
- Verified: normalization/validation cases in SQL, `on_auth_user_created` trigger intact, both signup pages at 390px AR with no gender field, no overflow, no console errors. Typecheck and build clean.

## Phase 50 — Security page truthfulness + real MFA enforcement (تم)
- قاعدة البيانات: `mfa_access_ok()` (self-scoped) و`require_mfa()`؛ سياسة RESTRICTIVE "mfa level required" على 26 جدولاً خاصاً؛ `my_sessions` مقيّدة؛ إضافة `PERFORM public.require_mfa()` إلى 32 دالة أعمال SECURITY DEFINER. الجداول العامة المنقّحة والتخصصات والباقات والأدوار مستثناة.
- واجهة: مسار عام جديد `/mfa-challenge` (تحدي TOTP بـ6 أرقام، AR/EN، جوال)، وحارس `_authenticated` يوجّه الجلسة aal1 إليه عند وجود عامل موثّق.
- صفحة الأمان: حُذف قسم البصمة/WebAuthn غير الحقيقي و`src/lib/webauthn.ts` (لم تُحذف صفوف trusted_devices التاريخية)؛ تغيير كلمة المرور صار يعيد المصادقة فعلياً بكلمة المرور الحالية ثم يُنهي الجلسات الأخرى؛ الحسابات بجوجل فقط تحصل على رابط تعيين كلمة مرور بدل حقل وهمي؛ ربط جوجل عبر linkIdentity فقط بلا بديل قد يبدّل الحساب.
- ملاحظات linter: `ai_usage_events` بلا سياسة عمداً (مغلق)، والviews المنقّحة ودوال الأعمال قابلة للتنفيذ عمداً حسب التصميم.

## Phase 51 — MFA session stability during password change + session-change gate (مكتملة)
- `src/lib/reauth.ts` جديد: `verifyCurrentPassword` عبر عميل Supabase مؤقت (`persistSession:false`, `autoRefreshToken:false`, `detectSessionInUrl:false`, `storage:undefined`) + مطابقة `user.id`، ثم `signOut({scope:"local"})` للعميل المؤقت فقط. لا تخزين لكلمة المرور أو رمز الوصول.
- `security.tsx`: `changePassword` لم يعد يستدعي `signInWithPassword` على العميل الأساسي؛ جلسة aal2 تبقى سليمة ثم `updateUser({password})` + `signOut({scope:"others"})`.
- `_authenticated/route.tsx`: تبعيات فحص الجلسة/AAL صارت `[navigate, attempt, accessToken]` فيعاد الفحص فور تغيّر الجلسة؛ والتحويل إلى `/mfa-challenge` لا يحدث إلا مع عامل TOTP موثّق (منع حلقة aal2→challenge→dashboard).
- Migration: `mfa_access_ok()` تقتصر على `factor_type='totp'` الموثّق؛ وأُعيد إنشاء سياسة `mfa level required` على 24 جدولاً باستخدام `(select public.mfa_access_ok())` بلا تغيير في الدلالات.
- تحقق: typecheck/build نظيفان، 390px بلا overflow ولا أخطاء console، 24/24 سياسة محسّنة.

## Phase 52 — Account & Privacy center + verified deletion-request workflow ✅
- جدول `account_deletion_requests` (RLS: قراءة المالك/الإدارة فقط، لا كتابة مباشرة، سياسة MFA المقيدة، فهرس فريد لطلب فعّال واحد).
- RPCs: `request_account_deletion` (idempotent، البريد من auth، سبب ≤1000)، `cancel_account_deletion` (المالك، pending فقط)، `admin_update_account_deletion` (إدارة + MFA، انتقالات محددة). anon محروم.
- تبويب «الحساب والخصوصية» في الإعدادات: ملخص الحساب، روابط البيانات والسياسات، طلب حذف مع تأكيد وسبب اختياري وحالة/إلغاء.
- تبويب «طلبات حذف الحساب» في /admin عبر RPC فقط، بلا حذف مستخدمين.
- تصحيح نصوص الشروط (بند 8) والخصوصية (بند 6 و8).
- اختبارات DB: idempotent، عزل المستخدم الآخر، إلغاء pending، منع إلغاء processing، منع غير الإدارة — ونُظّفت بيانات QA.
