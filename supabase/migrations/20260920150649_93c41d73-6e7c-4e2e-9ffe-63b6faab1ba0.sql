-- Phase 70: tracked cleanup of the four pristine shifts with impossible durations,
-- then full validation of the duration invariant. Idempotent: the deletes are no-ops
-- once applied, and VALIDATE CONSTRAINT is a no-op on an already validated constraint.
DELETE FROM public.shifts s
WHERE s.id IN (
  '55c41139-02b3-4465-9d80-e7877f039692',
  '244ffb5f-d14b-4652-b0ff-124d9a7e255b',
  'dd6160f4-66c8-4851-af84-3ca63254c09f',
  '413f48c8-5f2c-43a3-827a-1ba71900d2b1'
)
  AND NOT (s.ends_at > s.starts_at AND s.ends_at <= s.starts_at + interval '24 hours')
  AND NOT EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.shift_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.invitations i WHERE i.shift_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.interviews iv WHERE iv.shift_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.conversations cv WHERE cv.shift_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.shift_id = s.id);

ALTER TABLE public.shifts VALIDATE CONSTRAINT shifts_duration_valid;