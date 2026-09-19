# تدقيق شامل للحالة الحالية — SyndeoCare (بدون أي تعديل)

تدقيق مبني على قراءة الكود الفعلي واختبار حي على المعاينة، وليس على roadmap أو خطط سابقة.

## ما تم اختباره فعلياً

- 21 صفحة عامة على 320 / 768 / 1280 بكسل: لا تمدد أفقي إطلاقاً، لا أخطاء في الـ console، الصفحة غير الموجودة ترجع 404 وتعرض صفحة صحيحة.
- الرحلة المسجّلة بحساب **مختص صحي حقيقي** (جلسة اختبار): لوحتي، نشاطي، ملفي، الإعدادات، الأمان، الرسائل، الإشعارات، الدعوات، الفرص، المحفوظات — كلها تفتح ببيانات حقيقية بلا أخطاء ولا تمدد على 320 و1280.
- حراس الأدوار: المختص عند فتح `/facility` أو `/facility/candidates` أو `/admin` أو `/onboarding` يُعاد إلى `/dashboard` — يعمل صحيحاً.
- التحويلات القديمة: `/saved` → `/activity?tab=saved` و`/shifts` → `/jobs?kind=shift` و`/pricing` → `/for-facilities` تعمل.

## ما لم يمكن اختباره

- رحلة **المنشأة** كاملة (نشر وظيفة/مناوبة، المتقدمون، اختيار/رفض مرشح، التوثيق، بحث المرشحين) — لا يوجد حساب منشأة للاختبار.
- رحلة **Admin** — لا يوجد حساب إدارة.
- عمليات كتابة فعلية (تقديم، حجز، دعوة، مقابلة) — تجنّبت تنفيذها حتى لا أغيّر بيانات حقيقية.
- إرسال البريد/واتساب (معطّل حتى الاعتمادات) وسلوك الإنتاج الحقيقي للـ cron.

---

## P0 — يمنع الإطلاق

1. **زائر غير مسجّل يفتح صفحة محمية فيرى «تعذّر التحقق من حسابك» بدل صفحة الدخول.**
   مؤكد حياً على `/dashboard` و`/facility` و`/admin` (status 200، بطاقة خطأ + زر إعادة المحاولة، بلا أي رابط للدخول).
   السبب: `src/routes/_authenticated/route.tsx:55-60` — `supabase.auth.getUser()` يرجع خطأ «جلسة مفقودة» عند عدم وجود جلسة، والكود يعامله كعطل شبكة (`setAuthError(true)`) بدل التحويل إلى `/auth`. أي رابط محفوظ أو مشارَك لصفحة داخلية يصبح طريقاً مسدوداً.

2. **دالة خادم مكلفة مفتوحة بلا مصادقة.**
   `src/integrations/supabase/auth-middleware.ts` (requireSupabaseAuth) معرّف لكنه **غير مستخدم في أي مكان**. نتيجة ذلك `parseCv` في `src/lib/cv.functions.ts:20-100` — وهي تستدعي بوابة الذكاء الاصطناعي المدفوعة — قابلة للاستدعاء من أي شخص بلا حساب، وكذلك `src/lib/notifications.functions.ts:4-7`.

## P1 — يجب إصلاحه قبل الإطلاق

3. **وميض «خطوة تالية» خاطئة عند أول فتح للوحة المختص.** أول تحميل بارد لـ `/dashboard` عرض «أهلاً بك» + «أكمل ملفك المهني أولاً» لحساب ملفه مكتمل فعلاً (`src/routes/_authenticated/dashboard.tsx`)؛ التحميل التالي عرض الاسم والخطوة الصحيحة. السبب: حساب الخطوة التالية يجري قبل وصول بيانات الملف بدل انتظارها.

4. **أهداف لمس أصغر من 44 بكسل على أزرار حقيقية.** `size-9` (36px) في: `src/routes/_authenticated/messages.tsx:606,869,884` (رجوع، إلغاء المرفق، إرسال)، `src/routes/_authenticated/facility.index.tsx:545,631`، `src/components/account-hub.tsx:216,263`، `src/components/dashboard-shell.tsx:137`، و`src/components/voice-recorder.tsx:129,150,193,204,208` (غير متسق داخل نفس المكوّن).

5. **صفحة الأسعار ميتة بالكامل.** `src/routes/_public.pricing.tsx:11-14` يحوّل فوراً إلى `/for-facilities`، بينما الملف يحتوي 271 سطراً من صفحة أسعار كاملة مع استعلام باقات وميتاداتا — تُشحن في الحزمة ولا تُعرض أبداً. قرار مطلوب: إحياؤها أو حذفها (الأسعار حالياً غير معروضة لأي زائر).

## P2 — يؤثر على الجودة والثقة

6. **عناوين الصفحات والميتا بالعربية فقط دائماً.** `head()` في كل المسارات نص عربي ثابت لا يمر على قاموس الترجمة (مثال: `src/routes/_authenticated/settings.tsx:27-38`، `src/routes/_public.specialties.index.tsx:39-50`) — مستخدم الإنجليزية يرى تبويب المتصفح ومعاينة المشاركة بالعربية.
7. **عناوين صفحات التفاصيل عامة وليست ديناميكية (SEO).** `_public.jobs.$jobId.tsx:138` = «تفاصيل الوظيفة» بدل عنوان الوظيفة؛ نفس الشيء في `_public.shifts.$shiftId.tsx:125` و`_public.facilities.$facilityId.tsx:82`، بينما صفحات المدونة والأدلة تستخدم العنوان الحقيقي.
8. **صفحات بلا حالة تحميل/خطأ.** `src/routes/_public.specialties.index.tsx:59-68` (عند الفشل شبكة فارغة بلا رسالة ولا إعادة محاولة)؛ `src/routes/_authenticated/settings.tsx:167-220` يبتلع الخطأ بـ `if (!data) return null`.
9. **مسارات تفاصيل بلا `errorComponent`:** `_public.jobs.$jobId.tsx:150`، `_public.shifts.$shiftId.tsx:137`، `_public.specialties.$slug.tsx:53`، و`_public.facilities.$facilityId.tsx` (بلا `notFoundComponent` أيضاً) — تسقط على الحد العام بدل رسالة في سياق الصفحة.
10. **ألوان ثابتة تتجاوز نظام التصميم:** `messages.tsx:813` (`bg-black`)، `src/components/chat-attachment.tsx:145,171,193,222,329-358`، `panels/security.tsx:743`، ونمط `bg-white/12 ring-white/20` مكرر في 9 صفحات عامة.
11. **محاذاة غير مراعية للاتجاه:** `src/components/ui/dialog.tsx:58` يستخدم `sm:text-left` بدل `text-start` (يؤثر على رأس كل حوار)؛ `_public.pricing.tsx:203` يستخدم `mr-2`.
12. **مقارنة سر الـ cron غير آمنة زمنياً:** `src/routes/api/public/dispatch-alerts.ts:14-21` يقارن بـ `!==` مع أن المشروع يملك تنفيذاً صحيحاً غير مستخدم في `src/integrations/supabase/cron-auth.ts:2-35`.
13. **`candidate_search_access` بلا RLS:** الجدول أُبقي `DISABLE ROW LEVEL SECURITY` مع منح `service_role` فقط — آمن اليوم لكنه هشّ إذا مُنح `authenticated` لاحقاً.
14. **`profile` و`facility` و`facility/profile` لا تتحقق من قيمة `tab` في الرابط** (`profile.tsx:36`, `facility.index.tsx:76-80`) — قيمة خاطئة تمرّ بصمت.

## P3 — تنظيف

15. **مسارات يتيمة (تحويلات لروابط قديمة لا يشير إليها شيء):** `/alerts`, `/applications`, `/my-shifts`, `/saved`, `/preferences`, `/facility/applicants`, `/facility/verification`, `/pricing`.
16. `src/components/ui/combobox.tsx:36-38` قيم افتراضية عربية بلا ترجمة (كل الاستدعاءات الحالية تمرّر نصاً مترجماً، لكنه فخ لأي استدعاء جديد).
17. رسائل خطأ خام من قاعدة البيانات تُعرض للمستخدم: `onboarding.tsx:377,615`، `_public.register.index.tsx:201`، `_public.register.employer.tsx:238`، `panels/security.tsx:294,330,404,475,515`.
18. اختلاف أسلوب التحقق من النماذج: 4 ملفات فقط تستخدم مخطط zod، والباقي تحقق يدوي.

## نتائج إيجابية مؤكدة

- خصوصية هوية المختص مطبّقة في قاعدة البيانات لا في الواجهة فقط: سياسة `healthcare_professionals` تسمح بالقراءة للمالك أو الإدارة أو منشأة بينها وبينه طلب/حجز/محادثة؛ و`search_candidates` لا ترجع الاسم إطلاقاً.
- كل الجداول العامة (29) لديها RLS + GRANT + سياسات.
- دوال SECURITY DEFINER الحساسة (`review_change_request`, `claim_professional_role`, `set_application_stage`, `hire_applicant`) تضبط `search_path` وتتحقق من الصلاحية داخلياً، والتحديث المباشر على `applications` مسحوب من `authenticated`.
- مفتاح الخدمة محصور في ملفات `.server.ts` ولا يصل إلى المتصفح.
- الإجراءات الخطرة كلها خلف حوار تأكيد، وأزرار الحفظ تُعطَّل أثناء التنفيذ.
- لا `console.log` ولا TODO ولا نص placeholder في الكود.

## الخطوة المقترحة

هذا تقرير تدقيق فقط ولم يُعدَّل أي ملف. لو وافقت، أُعدّ خطة إصلاح منفصلة تبدأ بـ P0 (1 و2) ثم P1.
