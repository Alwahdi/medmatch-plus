ALTER TABLE public.shifts
  ADD CONSTRAINT shifts_duration_valid
  CHECK (ends_at > starts_at AND ends_at <= starts_at + interval '24 hours') NOT VALID;