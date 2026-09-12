DELETE FROM public.applications WHERE job_id IN (SELECT id FROM public.jobs WHERE title LIKE 'اختبار:%');
DELETE FROM public.saved_jobs WHERE job_id IN (SELECT id FROM public.jobs WHERE title LIKE 'اختبار:%');
DELETE FROM public.jobs WHERE title LIKE 'اختبار:%';
DELETE FROM public.shifts WHERE title LIKE 'اختبار:%';
DELETE FROM public.shift_bookings WHERE user_id = 'be3cabf7-1e4f-41f9-9b33-0431fdd0c56b';