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

## Phase 53 — Public listing identity-leak prevention in free text ✅
- `guard_public_listing_identity()` + triggers على `jobs` (title/description) و`shifts` (title/notes): رفض الروابط (`http://`, `https://`, `www.`)، البريد الإلكتروني، الأرقام الطويلة (9+ بعد إزالة الفواصل) أو `+` دولي، وكلمات واتساب/تلجرام مع رقم 7+، واسم المنشأة (ar/en، طوله ≥3، مقارنة مطبّعة) ونطاق موقعها. رمز الخطأ `LISTING_IDENTITY_DISCLOSURE`. `required_license` (رمز دولة) لا يُفحص. لا استثناء للإدارة لأن النتيجة عامة.
- الأرقام العادية (سنوات الخبرة، 2026، الرواتب في حقولها) غير متأثرة — الحد 9 أرقام متتالية اختير لتجنب false positives.
- `private.owner_account_exists()` بدل استعلام `auth.users` داخل `public_jobs`/`public_shifts` (إغلاق تنبيه Exposed Auth Users بلا تغيير سلوك).
- الواجهة: `src/lib/listing-privacy.ts` فحص مبدئي مطابق، نص إرشادي تحت وصف الوظيفة وملاحظات المناوبة، ملاحظة خصوصية هادئة في شاشة المراجعة، رسالة ودية AR/EN، والمسودة تبقى محفوظة عند الرفض.
- اختبارات (rollback فقط): وصف طبي عادي مقبول؛ اسم المنشأة/بريد/https/www/واتساب+رقم/+967 مرفوضة؛ 20 وظيفة قائمة تمر بلا فشل. (4 مناوبات قديمة تفشل على قيد `shifts_duration_valid` السابق — غير متعلق بهذه المرحلة.)
- typecheck/build نظيفان؛ /jobs و/shifts بلا overflow ولا أخطاء على 320/390/1440.

## Phase 54 — Technical SEO, crawl hygiene & share metadata (مكتملة)
- robots.txt: السماح بالصفحات العامة ومنع المسارات الخاصة/الحسابية + Sitemap directive.
- sitemap.xml ديناميكي (/sitemap.xml): صفحات ثابتة + مدونة/أدلة/أسئلة + تخصصات + وظائف عامة (slug) + مناوبات مستقبلية. لا مسارات خاصة ولا /pricing ولا /shifts (تحويلات).
- src/lib/seo.ts: SITE_URL=https://syndeocare.ai، OG_IMAGE=/og-cover.png، canonical/shareMeta/NOINDEX/jobCanonicalPath (UUID → slug).
- canonical + og:url + og:image على كل الصفحات العامة (leaf فقط).
- noindex,nofollow على /auth /register /register/employer /reset-password /mfa-challenge وملف المنشأة العام و_authenticated/*.
- JSON-LD واقعي فقط: WebSite/Organization للرئيسية، BlogPosting للمقالات. لا JobPosting لأن هوية صاحب العمل مخفية عمداً.
- public/og-cover.png 1200x630 بهوية المنصة (لا صور مستخدمين/منشآت).
- تصحيح ادعاء غير موثق في المدونة (زمن التوظيف «خلال أيام»).

## Phase 55 — نوع حساب واحد لكل مستخدم (مكتملة)
- migration مطابقة للـhotfix: guard_single_account_type() على healthcare_professionals وfacilities (INSERT/UPDATE OF user_id)، غير قابلة للاستدعاء من anon/authenticated؛ المنشآت بلا مالك (user_id IS NULL) مسموحة.
- claim_professional_role/claim_facility_role يرفضان وجود النوع المعاكس (ملف أو دور) بخطأ ACCOUNT_TYPE_CONFLICT؛ EXECUTE لauthenticated/service_role فقط. دور admin يبقى إضافياً.
- UI: رسالة عربية/إنجليزية لـACCOUNT_TYPE_CONFLICT؛ onboarding يعرض ExistingTypeNotice لمن يملك ملفاً (بلا اختيار النوع المعاكس) مع إعادة محاولة التفعيل لنفس الملف؛ "تغيير نوع الحساب" يبقى لمن لا يملك ملفاً بعد؛ register.employer وcv-import صارا يعرضان الرسالة الودية.
- اختبارات rollback-only: T1–T8 نجحت (منع النوعين، السماح بنوع واحد، منشأة بلا مالك، admin+نوع واحد). لا تغيير على أي بيانات (2 كادر، 12 منشأة، 7 أدوار، 0 حساب بالنوعين).

## Phase 56 — إزالة بيانات العرض التجريبية من الواجهة العامة مع حفظ السجل (مكتملة)
- migration idempotent مطابقة للhotfix: `private.facility_has_live_owner`، إلغاء توثيق المنشآت بلا مالك، تصفير `facility_verified` لوظائفها/مناوباتها، تعريف `public.public_jobs`/`public.public_shifts` على المنشآت ذات المالك الحي فقط، واشتراط المالك الحي في `can_view_facility_identity`.
- لم تُحذف أي منشأة/وظيفة/مناوبة/تقديم/حجز — السجل محفوظ لأصحابه فقط.
- `public.my_inactive_employers()` (self-scoped, SECURITY DEFINER, authenticated فقط) تخبر المستخدم أن جهة عمل في سجله لم تعد نشطة دون كشف أي بيانات عنها.
- واجهة السجل التاريخي: «جهة العمل غير متاحة» في التقديمات والمناوبات، بلا تقييم أو مقابلة أو رابط للفرصة.
- نُقلت fixtures البذور من migration الإنتاج إلى `scripts/dev-seed.sql` (تجربة/تطوير فقط).
- الصفحة الرئيسية: حالات فارغة حقيقية للوظائف والمناوبات مع CTA، بلا أرقام أو بطاقات وهمية.
- تحقق: 0 وظائف/مناوبات عامة بلا مالك، 0 منشأة موثقة بلا مالك، 0 شارات توثيق خاطئة، 3 وظائف حقيقية / 0 مناوبات مفتوحة (واقعي). typecheck نظيف، build OK، الرئيسية بلا overflow على 320/390/1440.

## Phase 57 — حفظ سجل إلغاء حجوزات المناوبات (مكتملة)
- `shift_bookings`: أعمدة `cancelled_at`/`cancellation_actor`/`cancellation_reason`، وقيد الحالة `confirmed|cancelled`، وحذف UNIQUE(shift_id) مع فهرس فريد جزئي لحجز مؤكد واحد فقط لكل مناوبة.
- الإلغاء لم يعد يحذف الصف: `cancel_my_shift_booking` و`cancel_facility_shift` تحفظان السجل وتعيدان فتح/إغلاق المناوبة بشكل متّسق، مع إلغاء المقابلات المرتبطة وإشعار الطرف الآخر.
- `book_open_shift` يسمح بحجز جديد رغم وجود إلغاءات سابقة، والتضارب يُعالج كـ SHIFT_UNAVAILABLE.
- `applications_count` = عدد الحجوزات المؤكدة النشطة (يُحتسب إعادة احتساب لا زيادة عمياء).
- الواجهة: استعلامات الحجز النشط تفلتر `status='confirmed'`؛ «مناوباتي» تعرض الحجوزات الملغاة بشارة وتاريخ ومَن ألغاها بلا تقييم/مقابلة/رابط؛ بطاقة حجوزات المنشأة ترتّب المؤكد أولاً وتخفي إجراءات الصفوف الملغاة؛ التقرير الشهري يوضّح أنه يعدّ الحجوزات السارية.
- اختبارات DB (rollback): حجز→إلغاء (السجل يبقى والمناوبة تُفتح)، إعادة حجز بمستخدم آخر، منع صفّين مؤكدين، رفض حالة غير صالحة، إلغاء المنشأة يحفظ السجل ويغلق المناوبة، والإلغاء المتكرر idempotent. typecheck/build نظيفان، وفحص 320/390/1440 بلا تجاوز أفقي.

## Phase 58 — Professional application withdrawal + truthful history (done)
- enum `withdrawn` + `withdrawn_at`/`withdrawal_reason` (<=500) on applications.
- `jobs.applications_count` recomputed idempotently = applications where status <> 'withdrawn'.
- `withdraw_job_application(_application_id,_reason)`: owner + MFA, allowed from submitted/reviewing/shortlisted/interview, idempotent, cancels active linked interviews, notifies facility, keeps conversations.
- `submit_job_application` reactivates a withdrawn row (same id) when the job is still open.
- `set_application_stage` rejects `withdrawn` target and withdrawn rows; `hire_applicant` rejects withdrawn/rejected; `schedule_interview` rejects withdrawn.
- UI: withdraw action + optional reason on My applications; withdrawn history badge/date with no interview/review/message actions; job detail "Apply again" when open, history-only when closed; facility applicants show "Withdrawn by candidate" audit row (hidden from default pipeline, available via stage filter).
- DB tests passed (withdraw keeps row, count 1->0->1 on reapply, interview cancelled, facility actions blocked, hired/rejected not withdrawable).
- Not verified in browser: authenticated visual sweep (no test session could be minted this turn).

## Phase 59 — Server-side validation contract (done)
- Normalization triggers (trim/empty->null/currency uppercase) on profiles, healthcare_professionals, facilities, jobs, shifts, credentials, facility_documents, job_alerts, trusted_devices.
- CHECK constraints for all client-writable text lengths and numeric bounds (validated against live data).
- Blank name / blank job location rejected via trigger on new writes (legacy rows untouched).
- Constraint-name -> AR/EN message mapping in src/lib/user-errors.ts.

## Phase 60 — Future migration privilege safety gate (done)
- Revoked TRUNCATE/TRIGGER/REFERENCES/MAINTAIN from anon+authenticated on every public table/view (covers tables created after Phase 34).
- Tracked the live Phase 52 hotfix on account_deletion_requests (authenticated SELECT only, all writes via trusted RPCs).
- No client privileges on public sequences.
- New admin+MFA read-only report: public.release_privilege_audit().
- Convention documented in supabase/PRIVILEGE-SAFETY.md. Default DB privileges cannot be altered by this connector, so explicit grants are mandatory in every migration.

## Phase 61 — Public-view owner helper privacy regression fix (done)
- Dropped `private.owner_account_exists(uuid)`: it accepted an arbitrary auth user id and leaked account existence to any authenticated caller.
- Tracked the live redesign in a migration: `private.facility_has_live_owner(_facility_id uuid)` (SECURITY DEFINER, `search_path=''`) takes a facility id only and joins `public.facilities` -> `auth.users` internally.
- `public.public_jobs` / `public.public_shifts` recreated to call the facility-scoped helper; no owner user id is exposed in either view.
- Verified as anon: public_jobs readable (3 rows), public_shifts readable, 12 active jobs of ownerless/seed facilities excluded; old helper call from `authenticated` fails.
- Audit: remaining SECURITY DEFINER functions taking a user uuid are `can_view_facility_identity` (self-scoped) and the admin-gated role RPCs — no arbitrary-user existence probes remain.

## Phase 62 — Brand consistency & evidence-based product copy (done)
- Repo-wide sweep for `MediConnect` / `MedMatch` / old domains: no runtime or user-visible reference remains (only historical roadmap text and the auto-generated `previewAuthStorage.ts` preview-host check, which must stay).
- Contact page: removed the unbacked "within one business day" SLA (now "سنرد عليك في أقرب وقت ممكن / as soon as possible") and removed the raw backend error `console.error`; users still get a generic friendly message.
- Auth/register: replaced the unsubstantiated "strong encryption" claim with a factual access-control statement.
- For-facilities / home copy: removed "in hours, not weeks", "booked within minutes", "candidates start applying within minutes"; alerts described accurately as in-app.
- Verification copy unchanged where already accurate (badge = actual approval by the team).
- Canonical/SEO/email links keep `https://syndeocare.ai`; OAuth redirect still uses the current origin so preview/dev keep working.

### Release checklist (open, owner action)
- [ ] Lovable Project Description still shows the old `MediConnect Hub...` text. No setter is exposed to the agent, so the owner must update it manually to:
  `SyndeoCare is a healthcare recruitment and workforce platform connecting healthcare professionals with healthcare facilities through jobs, shifts, applications, interviews, secure messaging, credential verification, and structured hiring workflows.`

## Phase 63 — Production HTTP security headers + CSP (done, CSP report-only)
- New `src/lib/security-headers.ts` applies headers centrally; wired as the first `requestMiddleware` in `src/start.ts` (SSR + server routes) and around the generic 500 pages in `src/start.ts` / `src/server.ts`. Never overwrites Content-Type, cookies or an existing Cache-Control.
- Always on: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/microphone/geolocation/payment/usb/serial/sensors/display-capture (verified: no product feature uses them), `Cross-Origin-Opener-Policy: same-origin-allow-popups` to keep the Google sign-in popup working. No COEP (would break Google Fonts / cloud assets).
- Production-host only (`syndeocare.ai`, `www.syndeocare.ai`, https): `Strict-Transport-Security: max-age=31536000; includeSubDomains` and `X-Frame-Options: DENY`. Deliberately skipped on localhost and the Lovable preview host, which renders the app inside an editor iframe.
- CSP shipped as **Content-Security-Policy-Report-Only** on HTML responses: `default-src 'self'`; `style-src` + `font-src` limited to fonts.googleapis.com / fonts.gstatic.com; `img-src 'self' data: blob:` + the cloud origin (signed storage URLs); `connect-src 'self'` + cloud HTTPS/WSS + the Lovable auth broker / AI gateway origins; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. No wildcard `https:`.
- Own inline bootstrap removed: the language bootstrap moved from `dangerouslySetInnerHTML` to same-origin `public/lang-boot.js`. `script-src` still needs `'unsafe-inline'` because TanStack Start emits inline hydration payloads without a nonce hook.
- Cache: `Cache-Control: no-store, max-age=0` on HTML for `/auth`, `/reset-password`, `/mfa-challenge`, `/api` and every authenticated path prefix; hashed static assets keep framework caching.
- Error hygiene: full errors still go to server logs only; responses keep the generic `renderErrorPage()` body with no stack or message.
- Verified with curl (200, 404, /settings no-store) and Playwright on `/`, `/jobs`, `/auth`, `/reset-password`: fonts and assets load, zero CSP report-only violations, no failed app requests.

### Release gate (open)
- [ ] Switch `content-security-policy-report-only` to enforcing `content-security-policy` only after observing the production host for report-only violations (signed storage URLs, OAuth broker, realtime WSS), and after a nonce is available for the framework's inline hydration script.

## Phase 64 — Mobile-first performance & interaction acceptance (done, measured)
Measurement tool: Playwright + CDP on the **dev server** (4x CPU throttling, ~1.6 Mbps / 150 ms RTT, 390x844 DPR3 mobile emulation). Lighthouse against a production build is not runnable from this sandbox, so JS transfer numbers below are dev (unbundled) figures and are **not** representative of production bundles — treated as a known measurement gap, not a result.

Before -> after (home `/`, same profile):
- Image bytes: **346 KB -> 98 KB** (-72%).
- CLS 0.003 -> 0.003; `/jobs` and `/auth` CLS 0.
- LCP: 2848 ms -> 2672 ms (dev SSR module loading dominates; FCP == LCP == DCL on every run, so LCP here tracks dev compile time, not image weight). `/jobs` 704 -> 668 ms, `/auth` 712 -> 656 ms.
- Console errors: 0 on `/`, `/jobs`, `/auth`.

Changes:
- Replaced `hero.jpg` / `for-professionals.jpg` / `for-employers.jpg` (1600x1104 and 1280x960 JPEG, 128/112/113 KB) with responsive WebP sets: hero 640/960/1280/1600 (15/25/36/49 KB) and card images 640/1024 (~17/30 KB). Old JPEGs deleted.
- Hero: `srcSet` + `sizes="100vw"`, explicit width/height, `fetchPriority="high"`, `decoding="async"`, never lazy. At 390px DPR3 the browser correctly picks `hero-1280.webp`.
- Card images: `srcSet` + `sizes="(min-width: 768px) 50vw, 100vw"`, `loading="lazy"`, `decoding="async"`.
- Dropped the head `<link rel=preload>` for the hero: the head serializer emitted a duplicate href-less preload tag, and the `<img>` is already in the SSR HTML with high priority.

Verified, no change needed (already correct from earlier phases):
- Fonts: Cairo via Google Fonts with `display=swap` + preconnect; weights 400/500/600/700/800 all in use (`font-medium/semibold/bold/extrabold` + body). Not self-hosted — no font files copied, no license ambiguity.
- Overflow sweep at 320/360/390/430 over `/`, `/jobs`, `/auth`, `/for-facilities`, `/pricing`, `/register`: **zero horizontal overflow**.
- iOS zoom: inputs/textarea use `text-base` (16px) on mobile, `md:text-sm` only from tablet up.
- Safe areas (`--app-safe-bottom`, `--app-bottom-nav`) and `prefers-reduced-motion` handling already in `src/styles.css`; dialogs are `max-h-[92dvh]` with independent body scroll.
- Double-submit: auth, register, contact and message composer all disable their submit control while pending.
- OfflineBanner is status-only (hides no action) and re-invalidates queries when connectivity returns; no fake offline writes exist.
- Heavy UI modules (`ui/chart`, `ui/carousel`) are imported nowhere outside `src/components/ui`, so they are tree-shaken out of public bundles; routes are file-split by TanStack.

Open (needs production infra):
- [ ] Re-run LCP/INP on the published production build over a real mobile profile and confirm LCP < 2.5s / CLS < 0.1. Dev-server numbers cannot confirm the target.

## Phase 66 — Block direct destructive identity/history deletes (DONE)

Tracked idempotent migration matching the live hotfix, plus a full audit of DELETE grants/policies.

Revoked (no client delete path, cascade/history risk):
- Identity rows: `facilities` (policy `facility owner delete` dropped), `profiles`,
  `healthcare_professionals`, `conversations`, `messages`, `trusted_devices`.
- Listings: `jobs`, `shifts` — no delete UI exists; closing a job (`is_active=false`) and
  `cancel_facility_shift()` are the intended workflows, so `guard_listing_history_delete()`
  is now a second line of defence rather than the only one.
- Dead grants: `invitations`, `profile_change_requests`, `shift_bookings`
  (policy `booking cancel before start` dropped; cancellation is `cancel_my_shift_booking()` RPC).

Kept (intentional owner deletion, verified against UI):
`notifications`, `message_reactions`, `saved_jobs`, `job_alerts`, `credentials`,
`facility_documents`. Verification state recalculates via existing sync triggers.

Verified after migration — `authenticated` holds DELETE on exactly those six tables;
remaining DELETE policies are credentials / facility_documents / message_reactions /
notifications (job_alerts and saved_jobs are covered by FOR ALL own-row policies).
`service_role` retains full access for trusted backend operations.

Account deletion: Phase 52 request workflow stays the only user-facing route; it records
state and does not hard-delete. Any future erase/anonymisation must be a trusted
backend/admin operation with a retention strategy — direct facility/profile deletes must
never be restored.

Typecheck clean, build OK.

## Phase 68 — Minimal Trust & Safety reporting workflow (DONE)

New `public.safety_reports` table: reporter (FK `auth.users`, ON DELETE CASCADE), constrained
`target_type` (job/shift/conversation/message), `target_id`, constrained `category`
(misleading / fraud_or_fee / harassment / privacy / unsafe_content / other), optional
`details` (<=1000), constrained `status` (open/reviewing/resolved/dismissed, default open),
`admin_note`, `created_at`/`updated_at`/`resolved_at`. No listing or message content is
copied into the report row — admins resolve target context through the trusted admin RPC.

Privileges (Phase 60 rule): `REVOKE ALL FROM PUBLIC, anon, authenticated`, then
`GRANT SELECT TO authenticated` and `GRANT ALL TO service_role`. RLS on, with the Phase 50
restrictive `mfa level required` policy plus SELECT for own reports and SELECT for admins.
No client INSERT/UPDATE/DELETE anywhere — writes go through RPCs only.

RPCs (all SECURITY DEFINER, `SET search_path`, `REVOKE ALL FROM PUBLIC, anon`, explicit
EXECUTE grants):
- `submit_safety_report(_target_type,_target_id,_category,_details)` — `require_mfa()`,
  reporter derived from `auth.uid()`, validates the target exists and the reporter has
  legitimate visibility (job/shift: currently listed, or own application/booking/invitation;
  conversation: `is_conversation_participant`; message: participant of its conversation).
  Duplicate open/reviewing report of the same reporter+target+category returns the existing
  id (also enforced by a partial unique index). Daily quota of 20 per user under
  `pg_advisory_xact_lock`. No notification to the reported party.
- `admin_list_safety_reports(_status)` and `admin_update_safety_report(_id,_status,_note)` —
  `require_mfa()` + `has_role(auth.uid(),'admin')`, transitions open→reviewing/resolved/
  dismissed and reviewing→resolved/dismissed only. No automatic suspension or deletion.

UI: secondary "Report this job/shift" action on job and shift detail (signed-out users get a
sign-in link), an icon-only "Report conversation" action in the messages header, and a small
dialog with reason radios + optional details stating the report goes to the SyndeoCare review
team. New `Safety reports` admin tab with an open-count badge, newest-open-first list,
reviewing/resolve/dismiss with a note, and a link to the job/shift target.

Verified on live data as `authenticated` with QA rows removed afterwards (table back to 0):
participant can report a conversation; duplicate returns the same id; a signed-in user can
report a visible job; an outsider reporting that conversation or a message in it is blocked
with `REPORT_TARGET_NOT_VISIBLE`; the 21st report in a day is blocked with
`REPORT_QUOTA_EXCEEDED`; a non-admin calling the admin list gets `NOT_AUTHORIZED`; a direct
`UPDATE` on `safety_reports` is `permission denied`; reports are invisible to anyone but the
reporter and admins. AR/EN copy in place; typecheck clean, build OK.

Open: the admin-side triage flow could not be exercised end to end because no real admin
account is assigned yet (existing launch blocker).

## Phase 65 — Backend errors must never render as empty states (DONE)

New `src/lib/query-errors.ts` helpers (`unwrap`, `unwrapRows`, `unwrapCount`, `assertOk`) so a
failed request throws instead of returning an empty list, a null row, or a zero count.

Fixed: specialty detail (`Promise.all` ignored both errors and rendered "0 jobs / no shifts"),
post-login landing resolution (a failed roles read could send an admin to onboarding), messages
and conversation lookups, facility candidate profile, invite panel, notification read/clear,
delivery/read receipts, and the role-claim calls after profile creation. The MFA challenge and
the authenticated layout now fail closed with an error + retry instead of letting a failed
status read through. Raw errors are reported, never printed in the user's browser; fail-soft
was kept only where the fallback is truthful (avatar initial instead of a photo).

## Phase 67 — Harden public contact submission (DONE)

Guest contact no longer calls a privileged DB function from the browser. `submitContactMessage`
(`createServerFn`, POST, covered by the global CSRF middleware) validates with Zod
(name 2–120, email <=200, subject <=160, message 10–2000), drops honeypot and sub-second
submissions with a neutral success-like response, and calls the service_role-only
`public.submit_contact_message_internal(...)`.

That function keeps dedupe (same email + body within 24h), per-email 3/hour, and adds a global
circuit breaker of 30 accepted messages / 10 minutes, all inside one advisory lock. No IP or
fingerprint is stored. Outcomes map to `ok` / `rate_limited` / `invalid`; duplicates show the
same success copy.

## Phase 69 — Remove the obsolete contact RPC (DONE)

Confirmed the app calls only `submit_contact_message_internal`, then dropped
`public.submit_contact_message(text,text,text,text)` outright — no alias, no wrapper. It was
already service_role-only after Phase 67, but it carried weaker rules (4000-char message, no
global circuit breaker, no advisory lock) and was dead privileged code.

`release_privilege_audit()` was updated in the same migration: its SECURITY DEFINER check no
longer excepts `submit_contact_message` (no public function is anon-executable any more), and
`safety_reports` was added to the server-managed table list. `supabase/PRIVILEGE-SAFETY.md`
updated accordingly.

Verified on the live database: the old name is undefined for anon and authenticated;
`submit_contact_message_internal` is permission denied for both; a service_role call still
returns `ok` and writes one row (QA row deleted). Generated types no longer offer the old RPC.
Typecheck clean, build OK.

## Phase 70 — Shift duration cleanup + fully validated invariant (DONE)

Four legacy shifts had impossible durations (1–5 years) and were keeping
`shifts_duration_valid` in NOT VALID state. Each was pristine: no booking, invitation,
interview, conversation or review. The tracked migration deletes exactly those four IDs, each
still guarded by the same `NOT EXISTS` checks plus the duration predicate (no broad delete by
condition), then runs `ALTER TABLE public.shifts VALIDATE CONSTRAINT shifts_duration_valid`.
Both steps are no-ops on re-run.

Verified after migration: `shifts_duration_valid` is `convalidated = true`, 0 shifts violate
the rule (12 remain), and the whole `public` schema now has **0 NOT VALID CHECK constraints**.

Shift form (the only place shift times are entered — there is no separate edit form):
- Start and end labels now say the time is in the poster's local time.
- Inline AR/EN errors under the field (`role="alert"`, `aria-invalid`, `aria-describedby`)
  for a past start, an end at or before the start, and a duration over 24h — shown before
  submitting, with entered values preserved. The review button stays disabled while either
  field is invalid, and server-side validation is unchanged as the real boundary.
- `min` on both inputs (now+1min for start, the start value for end) so the native mobile
  pickers steer away from invalid values.
- Moving the start no longer carries a stale end into another day or year: the end is
  re-derived to start+8h and an explicit "we adjusted the end time — please review it" hint
  appears, instead of silently changing it.
- Persisting still converts the local input through `toISOString()` into `timestamptz`,
  unchanged; both inputs keep the 48px-tall shared Input control at 320/390.

Typecheck clean, build OK.

## Phase 71 — Alert dispatcher hardening (DONE)

**Cron auth.** `src/routes/api/public/dispatch-alerts.ts` no longer compares the secret by hand.
It calls the shared `authenticateCronRequest(request)` (SHA-256 + `timingSafeEqual`, current and
previous secret for rotation, Bearer only — no second homemade header). Every response —
401, 500 and the JSON summary — carries `Cache-Control: no-store`, and failures return generic
text with the detail logged server-side only.

**Fail-closed dispatcher.** `dispatchAlerts()` routes every `supabaseAdmin` read and write
through `ok()`, which logs the backend message server-side and throws `DispatchError`:
- an alerts read failure can no longer report `alerts: 0`;
- the jobs/shifts `Promise.all` inspects both errors, so a failed half is never "no matches";
- the `alert_deliveries` read aborts the run **before any provider call** (treating that
  failure as "nothing delivered yet" would resend everything);
- recipient lookup, claim, finalize and `last_sent_at` errors are all checked.

**Atomic claim (no duplicate sends).** Before contacting a provider the run must own the row:
a new delivery is inserted as `processing` (a `23505` means a concurrent run won the race →
skipped), and an existing row is claimed with a compare-and-set update on
`id + status + attempt_count`; zero rows updated → skipped. No transaction is held across the
provider HTTP call. If persistence fails *after* a real send, the run raises instead of
reporting success and the row stays `processing`, retried only after
`PROCESSING_TIMEOUT_MS` (10 min) — no blind immediate resend. `shouldAttempt()` handles
`processing` accordingly. `last_sent_at` is display state only; `alert_deliveries` is the
source of truth.

**Schema.** Dropped the plain `(alert_id, job_id, channel)` unique constraint (NULL semantics
allowed duplicates) in favour of two partial unique indexes — `... WHERE job_id IS NOT NULL`
and `... WHERE shift_id IS NOT NULL` — plus validated CHECKs: exactly one target
(`(job_id IS NOT NULL) <> (shift_id IS NOT NULL)`) and
`status IN ('sent','failed','not_configured','processing')`. Privileges: nothing for `anon`,
`SELECT` for `authenticated`, `ALL` for `service_role`.

**Secret-safe provider errors.** `sanitizeProviderError()` in `notify.server.ts` collapses
whitespace, redacts the configured API keys, `Bearer …` and `authorization/api_key/token/
secret/password` patterns, and truncates to 300 chars before anything reaches the delivery log.

Verified: no/bad secret → 401 `no-store`; current and previous secrets → accepted; redaction
and the 300-char cap confirmed; at DB level duplicate job and shift deliveries are blocked,
the first claim updates 1 row and the concurrent second updates 0, both-targets and unknown
status rows are rejected (all inside a rolled-back transaction — no test data left; 0 rows in
`alert_deliveries` and `job_alerts`). `not_configured` still doesn't burn retries and becomes
attemptable once the channel is ready. No real email or WhatsApp was sent. Typecheck clean.

## Phase 72 — Trusted delivery/read receipts (DONE)

Receipts are no longer client-written. The `participants mark read` UPDATE policy is dropped
and `UPDATE` (table-level and the `read_at` / `delivered_at` column grants) is revoked from
`anon` and `authenticated`, so a modified client can no longer stamp its own sent message,
clear a timestamp, or write a fabricated/future one. Sending, reading and reaction flows are
untouched; `service_role` keeps full access.

Two `SECURITY DEFINER` RPCs (`SET search_path`, `require_mfa()`, `auth.uid()`-derived identity,
`REVOKE ALL FROM PUBLIC, anon` then `GRANT EXECUTE TO authenticated, service_role`):
- `mark_conversation_read(_conversation_id)` — participant check via
  `is_conversation_participant`, then updates only `sender_id <> auth.uid() AND read_at IS NULL`
  in that conversation, setting `read_at = now()` and
  `delivered_at = COALESCE(delivered_at, now())`. Returns the affected count.
- `mark_incoming_messages_delivered()` — updates only incoming messages with
  `delivered_at IS NULL` in conversations the caller belongs to; returns the count. Backed by a
  new partial index `messages_undelivered_idx (conversation_id, sender_id) WHERE delivered_at IS NULL`.

Both only fill NULLs, so timestamps can never be moved backward or forward, and all times are
server times.

Frontend (`src/lib/unread.ts`): both helpers call the RPCs and no longer take a `userId` — the
server derives identity. `markConversationRead` still runs only for the conversation actually
open. Realtime bursts are coalesced into a single delivered call (600 ms) and an in-flight
guard prevents overlapping RPCs; invalidations are unchanged.

Tested inside a rolled-back transaction (no QA data left): recipient direct UPDATE denied,
sender direct UPDATE denied, non-participant read RPC → `NOT_A_PARTICIPANT` and delivered RPC
touches 0 rows, recipient delivered RPC stamps the incoming message only, read RPC sets
delivered+read on incoming only, and repeat calls affect 0 rows with the original timestamps
preserved. Typecheck clean.

## Phase 73 — Loading / error / empty correctness sweep (DONE)

A "nothing here" message must mean the backend actually returned zero rows. Every screen below
now renders three distinct states: skeleton while loading, `ErrorState` + Retry on failure, and
the genuine empty state only after a successful `[]`.

**Invitations** (`_authenticated/invitations.tsx`) — the reported bug. It destructured `data`
only, so both loading and a failed query rendered "No invitations yet". Now
`isPending → ListSkeleton`, `isError → ErrorState` with retry, empty only on a successful
empty array. Accept/Decline busy state is per row and per action (`respond.variables`): the
other rows' buttons are disabled but not spinning, instead of every button in the list showing
a spinner. Errors stay friendly via `friendlyError` — no raw backend text.

**Second-pass sweep** (repo-wide, public + authenticated routes and panels):
- `useNotifications` (`src/lib/notifications.ts`) now also returns `isPending`, `isError`,
  `error` and `refetch`; the notifications panel renders a skeleton / error+retry instead of
  "No notifications" on a failed fetch.
- `_public.facilities.$facilityId.tsx` — the jobs and shifts child queries each get their own
  section-level skeleton and retry, so one failing half no longer reads as
  "No published jobs" / "No open shifts" while the rest of the profile is fine.
- `panels/alerts.tsx` — `isError` was destructured but never rendered; now error+retry and a
  loading skeleton gate the alerts empty state.
- `panels/invite.tsx` — "past collaborators" gets skeleton + retry; the "sent invitations"
  section no longer vanishes silently on error, it shows the section with a retry.
- `panels/cv.tsx` — the credentials block no longer prints "no credentials" on a complete
  profile while that query is loading or failing.
- `dashboard.tsx` — stat cards reserve the number's space with a skeleton instead of showing a
  false `0` before load, and the "latest applications" / "upcoming shifts" mini-lists show a
  skeleton instead of their empty copy during the initial fetch. Hard failures were already
  caught by the page-level error gate; no new full-page spinners were added.

**Documented cosmetic exception.** `useUnread` stays fail-soft: it drives chrome only (nav badge
and per-row counters) and degrades to "no badge", which claims nothing, while the messages page
itself still shows a real error state with retry for the conversation and message lists. This is
written into the hook's doc comment.

Verified: public facility profile renders correctly with a working backend and with the jobs
request blocked — no horizontal overflow at 390 and no console errors. **Not verified in the
browser:** the authenticated screens (invitations, dashboard, notifications, invite, CV) — no
signed-in session can be minted in this environment, the same standing blocker as the admin
account. Their states were changed by the same three-branch pattern used by the already-correct
panels. Typecheck clean.

## Phase 74 — Internal admin notes are never client-readable (DONE)

Row level security filters rows, not columns. Both `safety_reports` and `account_deletion_requests`
granted table SELECT to signed-in users with an own-row policy, so the person who filed a report or
a deletion request could query the row directly and read the internal `admin_note` (plus admin
processing metadata) even though no screen displayed it.

- Client SELECT is revoked on both tables from `anon` and `authenticated`; the owner SELECT policies
  are dropped. Reading now only happens through trusted functions.
- `my_account_deletion_request()` (auth + MFA) returns the owner's latest request with
  `id, reason, status, requested_at, updated_at, processed_at` — no `admin_note`, no email snapshot
  (the user knows their own email), no reviewer identity. Account & privacy uses it and no longer
  renders a team note.
- `admin_list_account_deletion_requests(_status)` (admin + MFA) returns the full queue including
  `email_snapshot` and `admin_note`; the admin deletion queue uses it. `admin_list_safety_reports`
  already covered the reports queue, and the reporter has no history screen, so no
  `my_safety_reports()` was added — an unused read surface is one more thing to keep safe.
- Request / cancel / admin-update RPCs are unchanged apart from explicit grants.

**Report target visibility now mirrors the public surface.** `submit_safety_report` accepted any job
with `is_active` or any shift with `status = 'open'`. Live data holds 12 active jobs whose facility
has no live owner — never shown publicly, yet reportable by anyone. A listing is now reportable only
if it is genuinely public (active, not expired / open and still in the future, and the facility has a
live owner) or the reporter has a real history with it: an application, booking, invitation, or a
conversation about it. Historical engagement stays reportable on purpose — someone who dealt with a
listing that has since closed must still be able to raise a concern about it.

**Cleanup tracking.** The single orphan QA fixture (user `2bd60a3b-…`) is recorded as a migration
guarded on that exact id, on the auth user being absent, and on the conversation having no messages.
It is a no-op now that the rows are gone, and it deliberately does not generalise into a sweep of
arbitrary orphans. Current counts: 0 orphan profiles, 0 orphan professional records.

Verified: neither table is SELECT-able by `anon` or `authenticated`; the owner RPC is granted to
signed-in users only and the admin RPC rejects `anon`; every new function had inherited privileges
revoked from `PUBLIC`/`anon` first. The contact cleanup and the privilege-audit wording asked for in
this round were already delivered in Phase 69 — the legacy `submit_contact_message(text,text,text,text)`
is dropped and the audit expects zero anon/PUBLIC SECURITY DEFINER endpoints. Admin-side screens
still need a real admin account to exercise end to end (standing launch blocker). Typecheck clean.

## Phase 75 — Alerts tell the truth about delivery (requested as "Phase 70"; that number was already used)

The alerts screen knew whether email / WhatsApp could actually deliver — it showed a soft banner —
and then let the user pick either channel anyway, save the alert, switch it on, and see a plain
"Email" badge. That reads as a working subscription. Neither provider is configured in this
environment, so every one of those alerts would have gone nowhere.

- Channel readiness is now fail-closed: while the status is loading or the status read failed, no
  channel counts as deliverable. A failed read no longer blanks the whole screen either — saved
  alerts stay visible with a short factual line and a retry.
- Unavailable channels stay listed but disabled and labelled "البريد الإلكتروني — غير متاح حالياً" /
  "Email — currently unavailable". With exactly one channel ready, that one is selected
  automatically. With none, "Add alert" is disabled and the copy states plainly that matching
  opportunities still appear in the app while external delivery is not available.
- The mutation re-checks readiness, so an alert can never be written against a dead channel even if
  the button is reached another way.
- Existing alerts are preserved and shown honestly: an unavailable channel carries
  "محفوظ — القناة غير مفعلة", and one still `is_active` shows "التفضيل مفعّل، لكن الإرسال غير متاح"
  rather than the database being silently rewritten. Such an alert can be switched off or deleted,
  but not switched on — blocked in the UI and in the mutation.
- Intro copy is conditional: delivery wording only when a provider can deliver, otherwise
  "احفظ معاييرك الآن، وستتمكن من تفعيل الإرسال الخارجي عند توفر القناة." In-app matching
  (NewMatchesCard) is unaffected — it works with no provider at all.

**Dispatch and provider status were already correct and were left alone.** `alertChannelStatus()`
counts WhatsApp ready only with token + phone number id + an approved template name (proactive sends
outside the 24h window cannot use plain text), and returns two booleans — no ids, no tokens.
The dispatcher records `not_configured` as its own delivery status, distinct from `sent`/`failed`,
retries such rows only once the channel becomes usable, and advances `last_sent_at` solely after a
real send.

Tested: no provider / email-only / WhatsApp-without-template readiness, credentials absent from the
status payload and redacted from logged provider errors, and the retry rule that an unconfigured
delivery is never treated as sent — 6 checks pass. Typecheck and build clean. The screen itself needs
a signed-in session to exercise end to end, which this environment cannot mint.

## Phase 76 — Explicit opt-in for candidate search visibility
- `healthcare_professionals.is_searchable` now defaults to false; added `search_visibility_confirmed_at` + CHECK (visible requires recorded consent); legacy row migrated to hidden with no inferred consent.
- Client write privileges on both visibility columns revoked; changes go only through `set_search_visibility(boolean)` (SECURITY DEFINER, require_mfa, own-profile only, stamps consent on opt-in, keeps last consent on opt-out).
- Legacy unfiltered `search_candidates` dropped; live search path filters `is_searchable = true`.
- Onboarding: unchecked opt-in toggle before finish; failure to enable visibility never fails onboarding.
- Profile: visibility switch drives the RPC (not the save payload) plus a visible "Visible in facility search" / "Hidden from search" state.
- Candidate results now show an honest "Not yet verified" state instead of silence.
- Privacy policy gained a visibility section (opt-in, exact fields shown, reversible).
- Verified in a rolled-back transaction: default off, consent-less visibility rejected, no client column writes, anon cannot execute the RPC, opt-in/opt-out states, search filter present, legacy function gone. Live data unchanged.

## Phase 77 — Consistent subscription lifecycle enforcement
- `private.subscription_is_live(status, ends_at)` + `private.facility_subscription_access(facility_id)` as the single eligibility source (internal, not client-executable).
- `enforce_plan_limits()` now requires status active/trialing AND future `ends_at`; distinct `NO_ACTIVE_SUBSCRIPTION` / `SUBSCRIPTION_INACTIVE` / `SUBSCRIPTION_EXPIRED`; facility-scoped advisory lock + `FOR UPDATE` so concurrent inserts cannot both pass a quota of 1.
- `consume_candidate_search()` and `search_candidates_idempotent()` reuse the same predicate; legacy `search_candidates_atomic` dropped.
- CHECK constraints validated: status/billing_period known values, `searches_used >= 0`. Explicit REVOKE/GRANT per Phase 60.
- UI: shared `subscriptionLifecycle()` / `subscriptionAllowsAccess()` in `facility.shared.ts`; facility dashboard and candidate search now show Trial active / Active / Ended / Inactive / No subscription with factual support-contact copy (no checkout, payments stay disabled). Unknown/loading state never renders a false block.
- Tests (rollback-only): trialing+future allowed, active+future allowed, cancelled+future blocked (INACTIVE), active+past blocked (EXPIRED), unknown status rejected, at-quota insert blocked. 13 trialing rows unchanged.

## Phase 78 — Operational release readiness (requested as Phase75; that label was taken)
- `release_readiness_report()` reworded: ownerless facilities are historical/seed records kept for history and excluded from public listing views (`info`).
- New checks: `ownerless_public_jobs`, `ownerless_public_shifts` (blocker if > 0), `verified_fac_without_required_docs`, `verified_pro_without_required_docs`, `both_domain_profiles`, `invalid_shift_duration`, `dangerous_client_privileges`, `client_tables_without_rls`.
- New server function `getOperationalReadiness` (`src/lib/readiness.functions.ts`): admin + MFA verified through DB RPCs, env inspected server-side only, returns booleans plus missing variable NAMES — never values. Reuses `alertChannelStatus()`. Email/WhatsApp/CV AI missing = warning (in-app notifications and manual entry still work), cron secret missing = blocker (proactive dispatch), `PUBLIC_SITE_URL` fallback = info, `payments_disabled_for_trial` = info product policy.
- New `AdminReadiness` component groups DB + operational checks into Blockers / Warnings / Ready / Info with AR/EN labels and remediation text; no publish CTA.
- Tests: unauthenticated `/_serverFn` call returns 403; response shape contains only booleans/names; live data verified (6 ownerless facilities, 0 leaks, 0 integrity failures). typecheck + build clean.

## Phase 79 — Verified-facility gate for proactive talent search (requested as Phase72; that label was taken)
- `search_candidates_idempotent`: resolves facility verification first and raises `FACILITY_VERIFICATION_REQUIRED` before creating the request row or touching quota. Results now require live account + `is_searchable` + Phase 71 explicit consent.
- New private helpers: `professional_is_discoverable`, `facility_is_verified`, `facility_pro_relationship`, `assert_proactive_contact_allowed` (service_role only).
- `start_candidate_conversation` / `send_candidate_invitation`: authorization split. Existing relationship (application, booking, conversation, invitation) always authorizes. Search-only contact requires a verified facility plus the candidate's current consent, evaluated live; audit rows in `candidate_search_access` are never deleted to enforce it. Distinct reasons: `CANDIDATE_NO_LONGER_SEARCHABLE`, `FACILITY_VERIFICATION_REQUIRED`, `CANDIDATE_CONTACT_NOT_ALLOWED`.
- Legacy `search_candidates` / `search_candidates_atomic` do not exist in this database — nothing to drop.
- UI: unverified facilities see a purpose-built locked state (AR/EN) on candidate search and in the invite panel, pointing at `/facility/verification` and explaining Applicants still works; no quota is consumed. Contact/invite race after opt-out shows a friendly reason and removes the candidate from the loaded results.
- Copy: for-facilities benefit and privacy visibility text now say candidate search is for verified facilities.
- Tests (rolled-back transaction): unverified search => FACILITY_VERIFICATION_REQUIRED with quota unchanged (8); verified search returns the consenting candidate; opt-out blocks new chat and invite; unverified blocks search-only contact; no basis => CANDIDATE_CONTACT_NOT_ALLOWED; applicant remains contactable after opt-out; existing conversation still resolves. Live data unchanged.

## Phase 80 — Candidate discoverability controls future search-based contact (requested as Phase76; that label was taken)
- New `private.candidate_contact_access_retention()` = 30 days, documented as contact-access retention: `candidate_search_access` audit rows are never deleted, they simply stop authorizing NEW outreach after the window.
- New central helper `private.can_facility_initiate_candidate_contact(facility, professional, job?, shift?)` returning the authorizing basis (`application` | `booking` | `conversation` | `invitation` | `search`) or NULL:
  - application: only `submitted/reviewing/shortlisted/interview/offer/hired`; `withdrawn`/`rejected` alone never authorize new outreach (history stays readable).
  - booking: only `confirmed` (covers completed shifts); cancelled does not.
  - conversation: authorizes only the same job/shift target, not a different thread.
  - invitation: only `pending`/`accepted`.
  - search: verified facility + current `is_searchable` consent + access newer than the retention window.
- `assert_proactive_contact_allowed` now takes the target and raises distinct reasons: `CANDIDATE_CONTACT_NOT_ALLOWED`, `FACILITY_VERIFICATION_REQUIRED`, `CANDIDATE_NO_LONGER_SEARCHABLE`, `CANDIDATE_SEARCH_ACCESS_EXPIRED`. Applied by `start_candidate_conversation` and `send_candidate_invitation`; the 2-arg variant was dropped.
- UI: friendly AR/EN message for expired search access; stale results drop the candidate on a failed contact/invite; profile visibility help text states that turning it off blocks new search-based invitations/messages without erasing applications or conversations.
- Tests (temporary data, fully rolled back): fresh access => `search`; opt-out => `CANDIDATE_NO_LONGER_SEARCHABLE`; stale access after re-enable => `CANDIDATE_SEARCH_ACCESS_EXPIRED`; withdrawn/rejected application alone => NULL; cancelled booking alone => NULL; active application => `application`; confirmed booking => `booking`; existing conversation authorizes only its own target. Live data verified unchanged afterwards.
- Phase 60 grants: private helpers service_role only; both public RPCs authenticated + service_role, revoked from anon/PUBLIC.

- Phase 81 (requested as Phase73): إيصالات الرسائل موثوقة — لا صلاحية تعديل مباشرة للعميل، RPCs المستلم فقط، backfill لـ11 صف قديم، CHECK قراءة⇐تسليم (validated)، صلاحيات صريحة Phase60. اختبارات: رفض التحديث المباشر، عدم لمس الصادر، delivered بدون read، idempotent، رفض غير المشارك.

- Phase 82 (requested as Phase77): شارة التوثيق مبنية على أدلة — sync يحسب is_verified = المستندات المطلوبة معتمدة AND لا تعليق إداري؛ admin_set_*(true) يرفض VERIFICATION_REQUIREMENTS_NOT_MET دون أدلة ويستخدم كاستعادة فقط؛ (false) يستلزم سبباً ويضع verification_suspended_at/reason ولا يُلغى بمراجعة المستندات. لوحة الإدارة: لا زر «توثيق» يدوي، بل قائمة المستندات المطلوبة بحالاتها وCTA للمراجعة وسحب/استعادة مع تأكيد. اختبارات (بيانات مؤقتة رولباك): بدون مستندات مرفوض، مستند واحد لا يوثّق، اعتماد الاثنين يوثّق تلقائياً، رفض مستند يسحب التوثيق، السحب يتطلب سبباً ويصمد أمام تعديل المستندات، الاستعادة تعمل مع أدلة قائمة، 0 صفوف موثّقة بلا أدلة.

- Phase 83 (requested as Phase74): دورة حياة الدعوة تتبع توفر الفرصة — قبول الدعوة يتحقق (مع قفل صف الفرصة) أن الوظيفة نشطة وغير منتهية أو أن المناوبة مفتوحة ولم يبدأ وقتها، وإلا INVITATION_TARGET_UNAVAILABLE بلا فتح محادثة؛ تريغرات تلقائية تلغي الدعوات المعلّقة عند إغلاق وظيفة/تعديل انتهائها للماضي أو خروج المناوبة من open، عبر علم معاملة app.invitation_system_cancel يتجاوز فحص الفاعل دون السماح إلا بالإلغاء؛ إشعار إلغاء واحد لكل دعوة؛ send_candidate_invitation يستخدم نفس الفحص مع القفل. الواجهة تجلب حقول التوفر وتعرض «الفرصة لم تعد متاحة» وتخفي زر القبول وتبقي الرفض وتحدّث القائمة عند الخطأ. اختبارات (رولباك): إغلاق وظيفة/مناوبة يلغي، إشعاران فقط لدعوتين، القبول بعد الانتهاء الزمني مرفوض دون صيانة، الرفض يعمل، المقبولة سابقاً ومحادثتها تصمد، 0 دعوة معلّقة لفرصة مغلقة حياً.

- Phase 84 (requested as Phase75): الدعوة تكشف هوية المنشأة للمدعوّ بصورة مشروعة — can_view_facility_identity أضافت EXISTS على invitations (المنشأة + الكادر المدعو) بأي حالة pending/accepted/declined/cancelled حتى لا يختفي سجل من أرسل الدعوة، مع بقاء شرط المالك الحي أولاً فتظل المنشآت بلا مالك مستثناة، وبقاء مسارات المحادثة/الطلب المتقدم/الحجز المؤكد كما هي. الواجهة: بطاقة الدعوة تعرض الاسم/الشعار/الموقع للمخوّل، وتستخدم حالة «جهة العمل غير متاحة» المحايدة عند تعذر الهوية بدل اسم وهمي، وشارة التوثيق تبقى مرتبطة بالأدلة. اختبارات (بيانات QA حُذفت): قبل الدعوة false، دعوة معلّقة true، بعد الرفض true، كادر غير مرتبط false، دعوة لمنشأة بلا مالك false، بعد حذف الدعوة false.

- Phase 85 (requested as Phase78): مرسل التنبيهات يقرأ من نفس السطح المعروض للعموم — الاستعلامات انتقلت من jobs/shifts الأساسية إلى public_jobs/public_shifts (مالك حي + وظيفة نشطة غير منتهية + مناوبة open ولم يبدأ وقتها)، مع الاحتفاظ بكل الحقول اللازمة للمطابقة والنص ودون إضعاف شروط العرض. قبل أي اتصال بالمزوّد يُعاد فحص وجود الإعلان في نفس العرض (fail-closed عند خطأ القراءة): إن اختفى يُحرَّر claim الجديد بالحذف أو يُعاد الصف القائم إلى حالته السابقة (status/attempt_count/last_attempt_at) ويُحتسب skipped بلا إرسال، فلا تُعاد محاولات not_configured/failed لإعلان لم يعد معروضاً. السجل المُرسَل سابقاً لا يتغير ومنطق المطابقة كما هو. القياس الحي: كانت الجداول الأساسية تتيح 15 وظيفة و8 مناوبات خلال 14 يوماً (منها 12 وظيفة و7 مناوبات لمنشآت بلا مالك، وكل المناوبات المفتوحة الثماني في الماضي)، والآن المؤهل 3 وظائف و0 مناوبة، و0 إعلان لمنشأة بلا مالك و0 منتهٍ و0 مناوبة ماضية.

- Phase 86 (requested as Phase76): فحص وصولية (WCAG) بلا تغيير بصري — axe آلي على المسارات العامة (/ /jobs تفاصيل وظيفة /auth /register /register/employer /contact /shifts /specialties /pricing /about /for-facilities /blog /guides) عند 320/390/768/1440 = 0 مخالفة بعد الإصلاح، وعلى مسارات الكادر بجلسة حقيقية (dashboard/profile/activity/messages/settings/security/invitations/alerts/saved/notifications/applications/credentials/preferences/my-shifts/cv) = 0 مخالفة. مسارات facility/admin لا جلسة لها (تحوّل إلى /dashboard بواسطة حارس الدور — تحقق فعلي من الحارس) فروجعت ثابتاً في الكود.
  الإصلاحات: (1) تباين — أُضيف --primary-strong (light/dark) وعُمّق --primary قليلاً، واستُخدم في الروابط الصغيرة والشارات؛ (2) بنية — NotFound/Error في __root صارا <main id="main-content" tabIndex={-1}> فاختفت مخالفات landmark/skip-link على المسارات غير الموجودة، وpage-chrome وdashboard-shell كذلك؛ (3) عناوين — h2 بدل <p> في قسم الرئيسية، h2 بدل h3 في التذييل، عنوان بديل عند غياب الاسم في الملف الشخصي؛ (4) أسماء وصفية — 6 قوائم Select (نوع المقابلة/نوع المستند/حالة الطلب/نوع المنشأة ×2/قناة الإشعار)، 4 قوائم تصفية في /jobs عبر props جديدة ariaLabel/ariaLabelledBy في combobox، 7 حقول بحث/ملاحظات بلا تسمية مرئية، شريط تقدم المستندات؛ (5) نماذج — LockedField صار يقبل inputId ويربط <Label htmlFor> بحقول الاسم/الخبرة/الترخيص/اسم المنشأة عربي وإنجليزي؛ (6) تركيز — حقلا البحث في الرئيسية كانا outline-none بلا بديل فأُضيف focus-visible ring؛ (7) MFA — InputOTP في لوحة الأمان أخذ autoComplete="one-time-code" واسماً وصفياً (mfa-challenge كان سليماً).
  فحوص أخرى: لا tabIndex>0، لا autoFocus، لا h-screen، لا onClick على عناصر غير تفاعلية (عدا stopPropagation)، prefers-reduced-motion موجود، جداول البيانات كلها بـ<th>، صورة واحدة بلا alt كانت تعليقاً وليست عنصراً، أهداف اللمس 44px بلا تراجع. البناء وفحص الأنواع نظيفان.

## Phase 77 — إزالة تسريب خصوصية الحضور العام (Presence)
- حُذف `src/lib/presence.ts` بالكامل (`useOnlineUsers` / `OnlineDotClass`)؛ لم تعد أي شاشة تشترك في قناة `online-users` ولا تبث `user_id` أو طابعاً زمنياً لأي قناة عامة.
- أُزيلت نقاط ونصوص «متصل الآن / غير متصل» من: ملف المنشأة العام (`_public.facilities.$facilityId`)، صفحة المرشح للمنشأة (`facility.candidates.$userId`)، ورأس المحادثة وقائمة المحادثات (`messages.tsx`) مع حذف مفاتيح النصوص من `panels/messages.shared.ts`. لم يُستبدل بأي «آخر ظهور» مشتق.
- التخطيط بقي متوازناً بعد الحذف (الصور بلا حاوية relative، لا فراغات).
- ملاحظة معمارية للمستقبل فقط: أي إعادة لميزة الحضور يجب أن تكون بقناة خاصة لكل محادثة مع Realtime Authorization مثبتة من طرف إلى طرف، وبدون كشف معرفات عامة. لم تُنفَّذ في هذه المرحلة.
- التحقق: بحث شامل في المستودع لا يُظهر أي أثر لـ`online-users`/`presenceState`/`track`؛ الزائر المجهول لا يملك أي مسار اشتراك يكشف معرفات أو حالة اتصال؛ المراسلة تعمل طبيعياً. فحص الأنواع نظيف.

## Phase78 — إنهاء سطح بيانات الأجهزة الموثوقة/WebAuthn القديم
- migration متتبّعة وidempotent تطابق الإصلاح الحي: حذف كل الصفوف من `public.trusted_devices`، إسقاط السياستين `own trusted devices` و`mfa level required`، و`REVOKE ALL` عن `anon` و`authenticated` مع إبقاء `service_role` فقط.
- الجدول لم يُسقط (مُشار إليه من migrations سابقة و`cleanup_orphaned_identities()`)؛ بقي جدولاً فارغاً للخادم فقط — وهو المقبول حسب المتطلب.
- بحث شامل: لا يوجد أي مسار تشغيل (عميل أو خادم) يقرأ/يكتب `trusted_devices`؛ الأثر الوحيد نوع مولّد في `src/integrations/supabase/types.ts` (تلقائي). `src/lib/webauthn.ts` محذوف من Phase50 ولا مستورد له.
- أُزيلت الإشارة إلى «البصمة» من وصف صفحة الأمان؛ لا ذكر لأجهزة موثوقة/بصمة/passkeys في نصوص الأمان والإعدادات.
- تدقيق الصلاحيات: `information_schema.role_table_grants` لا يُظهر أي صلاحية لـ`anon`/`authenticated`، عدد الصفوف = 0، عدد السياسات = 0.
- ملاحظة linter: تحذير «RLS مفعّل بلا سياسات» على هذا الجدول مقصود (جدول خادم فقط بلا وصول للمستخدمين).

## Phase79 — صفحة إعادة تعيين كلمة المرور تُثبت سياق الاستعادة
- أُلغي اعتماد «وجود أي جلسة» كإثبات. النموذج لا يظهر إلا بإثبات استعادة فعلي.
- `src/lib/recovery-proof.ts`: علامة قصيرة العمر (10 دقائق) في sessionStorage تُكتب حصراً عند حدث `PASSWORD_RECOVERY`، وتُمسح عند `SIGNED_OUT` وعند `SIGNED_IN` عادي (مع مهلة 5 ثوانٍ لتجاهل حدث الدخول المصاحب لنفس تدفق الاستعادة). لا يُخزَّن أي رمز أو كلمة مرور.
- المراقب يُثبَّت مبكراً على مستوى `__root.tsx` (module scope مع حارس `window`) حتى لا يفوت الحدث الناتج عن التبديل التلقائي للرمز.
- منطق الصفحة: `token_hash` + `type=recovery` => `verifyOtp` صريح؛ مسار `code/PKCE` => `exchangeCodeForSession` صريح، وإن كان العميل قد بدّله مسبقاً نقبل فقط علامة `PASSWORD_RECOVERY`؛ تدفق implicit => العلامة فقط؛ غير ذلك => `invalid`.
- بعد النجاح: تُمسح العلامة، ثم `signOut({ scope: 'global' })` لإنهاء كل الجلسات القديمة مع رجوع إلى الخروج المحلي عند الفشل.
- إصلاح واجهة الحالة غير الصالحة: زر رئيسي «طلب رابط جديد» -> `/auth`، وزر ثانوي صحيح التسمية «الصفحة الرئيسية» -> `/` (كان معنوناً «العودة لتسجيل الدخول» ويقود للرئيسية).
- اختبارات (390px): بلا معاملات، `?code=garbage`، `token_hash` غير صالح، ورابط منتهٍ => جميعها `invalid` بلا نموذج. ومع جلسة مستخدم حقيقية مسجّلة الدخول: `/reset-password` و`/reset-password?code=fake` => `invalid` (كانت تفتح النموذج سابقاً). AR/EN وnoindex كما هي.
- لم يُختبر رابط استعادة حقيقي من طرف إلى طرف لأن إرسال البريد غير مُفعّل؛ مسارا `verifyOtp` و`exchangeCodeForSession` صريحان ولا يعتمدان على وجود جلسة.

## Phase80 — اكتمال الملف/الإعداد مفروض من الخادم قبل الإجراءات التشغيلية
- دوال مساعدة SECURITY DEFINER بـ`search_path ''`: `private.professional_profile_complete(_user_id)` (حساب حي + صف كادر + اسم ≥2 + تخصص موجود + دولة ومدينة غير فارغة + سنوات خبرة 0..60) و`private.facility_profile_complete(_facility_id)` (مالك حي + اسم عربي ≥2 + نوع المنشأة والدولة والمدينة غير فارغة).
- `public.my_profile_completeness()` self-scoped عبر `auth.uid()` فقط (لا فحص لمستخدمين آخرين)، صلاحية تنفيذ لـ`authenticated` فقط.
- بوابات الأدوار: `claim_professional_role` => `PROFILE_INCOMPLETE`، `claim_facility_role` => `FACILITY_PROFILE_INCOMPLETE`، بعد فحص `ACCOUNT_TYPE_CONFLICT` ووجود الصف.
- بوابات تشغيلية: `submit_job_application`, `book_open_shift`, `set_search_visibility(true)` (الإيقاف يبقى متاحاً دائماً)؛ و`search_candidates_idempotent`, `send_candidate_invitation`, `start_candidate_conversation` قبل استهلاك أي حصة؛ و`guard_facility_profile_complete()` trigger BEFORE INSERT على `jobs` و`shifts`.
- المحادثات القائمة تُعاد كما هي عند نقص البيانات (البوابة تمنع التواصل الجديد فقط)؛ قراءة السجل والطلبات والوظائف السابقة غير متأثرة.
- لا تشديد مخطط مدمّر: لم تُجعل أعمدة التخصص/الدولة/المدينة NOT NULL؛ المنع عبر بوابات الإجراءات.
- الواجهة: `src/lib/profile-completeness.ts` (عرض فقط) + بطاقة «أكمل بياناتك» في لوحة الكادر ولوحة المنشأة بأولوية أعلى من التوثيق، ورسائل AR/EN لـ`PROFILE_INCOMPLETE` و`FACILITY_PROFILE_INCOMPLETE` في `user-errors.ts`.
- اختبارات (DO block على بيانات حية مع تراجع كامل): كادر مكتمل => `my_profile_completeness` صحيحة + claim ينجح؛ بعد إزالة التخصص => claim/apply/book/visible-on كلها `PROFILE_INCOMPLETE` بينما visible-off مسموح والسجل سليم؛ منشأة مكتملة => البحث يمر للبوابة التالية (`FACILITY_VERIFICATION_REQUIRED`)؛ منشأة ناقصة => claim/search/محادثة جديدة/إدراج وظيفة كلها `FACILITY_PROFILE_INCOMPLETE` بلا إنشاء أي صف وبلا فقدان سجل.
- صلاحيات least-privilege (Phase60) مطبّقة على كل الدوال الجديدة/المعدّلة. البناء وفحص الأنواع نظيفان.

## Phase81 — جدولة مقابلات المناوبات ضمن نافذة صالحة
- `private.assert_shift_interview_window(_shift_id,_scheduled_at,_duration_minutes)` (STABLE, SECURITY DEFINER, `search_path=''`): المناوبة يجب أن تكون `booked` و`starts_at > now()` وإلا `SHIFT_UNAVAILABLE`؛ ويجب أن تبدأ المقابلة وتنتهي (`scheduled_at + duration`) قبل `starts_at` وإلا `SHIFT_INTERVIEW_WINDOW_INVALID`.
- `schedule_interview`: فرع الحجز يستدعي البوابة بعد التحقق من `confirmed` وملكية المنشأة؛ ورابط الاجتماع لنمط `video` صار يشترط `https://` صراحة (`INTERVIEW_URL_INVALID`).
- `reschedule_interview`: المقابلات المرتبطة بمناوبة تُعيد فحص الحجز (`confirmed`) والنافذة قبل قبول الموعد الجديد؛ المقابلات المرتبطة بوظيفة بلا تغيير.
- `respond_to_interview`: القبول يفشل بـ`SHIFT_UNAVAILABLE` إذا لم تعد المناوبة محجوزة/مستقبلية، بينما الاعتذار يبقى متاحاً للسجل.
- الواجهة (`src/components/interview.tsx`): زر الجدولة يختفي عند عدم بقاء وقت كافٍ قبل بداية المناوبة مع سطر تفسيري؛ حقل الموعد له `max` محسوب من (بداية المناوبة − المدة) وتلميح AR/EN بموعد بدء المناوبة؛ تحقق محلي قبل الإرسال ورسائل AR/EN لـ`SHIFT_INTERVIEW_WINDOW_INVALID` و`SHIFT_UNAVAILABLE`؛ تمرير `shiftStartsAt`/`shiftLive` عبر `FacilityBookingsPanel` من لوحة المنشأة.
- اختبارات (DO block بتراجع كامل): مقابلة تنتهي قبل البدء => مسموحة؛ رابط `http` => مرفوض؛ إعادة جدولة متداخلة أو بعد البدء => `SHIFT_INTERVIEW_WINDOW_INVALID`؛ إعادة جدولة صالحة => تمر؛ قبول أثناء مناوبة حية => يمر؛ بعد إلغاء المناوبة => القبول `SHIFT_UNAVAILABLE` والاعتذار مسموح؛ جدولة جديدة على مناوبة ملغاة => `SHIFT_UNAVAILABLE`؛ لا صف تاريخي تغيّر.
- صلاحيات least-privilege (Phase60) على كل الدوال المعدّلة. البناء وفحص الأنواع نظيفان.

## Phase82 — تحويلات التوافق لا تُنشئ حلقات زر الرجوع
- `replace: true` مطبّق الآن على كل تحويلات التوافق: `/my-shifts` → `/activity?tab=shifts`، `/saved` → `/activity?tab=saved`، `/alerts` → `/settings?tab=alerts`، `/credentials` → `/profile?tab=credentials`، `/preferences?tab=report` → `/activity?tab=report`، بقية `/preferences` → `/settings?tab=alerts`، إضافةً إلى `/cv` و`/cv-import` → `/profile?tab=...` و`/facility/verification` → `/facility/profile?tab=verification`. (كانت مطبّقة سلفاً على `/applications`، `/facility/applicants`، `/shifts`، `/pricing`، `/facility/invite`.)
- تدقيق كامل لملفات التحويل: لا يوجد تحويل بلا `replace` بعد الآن.
- الروابط الداخلية صارت رسمية: `account-privacy.tsx` (`/cv`, `/credentials`) و`cv.tsx` (`/credentials`) تشير الآن إلى `/profile` مع `search={{ tab: ... }}`.
- روابط الإشعارات من قاعدة البيانات صارت رسمية: `notify_application` → `/activity?tab=applications`، `notify_credential` → `/profile?tab=credentials`، `cancel_facility_shift` → `/activity?tab=shifts`، مع تحديث لمرة واحدة للإشعارات المحفوظة سابقاً بالمسارات القديمة. صلاحيات least-privilege أُعيد تطبيقها على `cancel_facility_shift`.
- المسارات القديمة بقيت موجودة كتحويلات فقط لدعم الروابط/الإشارات المرجعية الخارجية؛ يُحفظ فقط معامل `tab` المدعوم ولا يوجد تحويل مفتوح لأي عنوان خارجي.
- اختبار متصفح: `/shifts` → `/jobs?kind=shift` و`/pricing` → `/for-facilities`، والرجوع يعود إلى `/jobs` لا إلى المسار القديم؛ المسارات المحمية القديمة تصل إلى `/auth?next=<الوجهة الرسمية>`. البناء وفحص الأنواع نظيفان.

## Phase83 — Browser-storage policy accuracy + client error hygiene
- /cookies retitled "Browser storage & cookies" / "التخزين في المتصفح وملفات الارتباط"; describes localStorage/session/auth storage functionally; removed unsupported performance-measurement/analytics claim (no analytics SDK in package.json).
- Privacy section 8 aligned: essential browser storage + cookies for session/preferences, no ads or cross-site tracking.
- No consent banner added (essential storage only).
- Removed console.error(error) from root ErrorComponent; reportLovableError is the single reporting path. Removed raw error log in admin change-request onError.
- Remaining console.* are server-only (start.ts, server.ts, *.server.ts, api routes, sitemap) or the error-capture pipeline.
- Footer link label updated. Tests: language persists after reload, AR/EN copy accurate, no console errors, tsgo clean.
