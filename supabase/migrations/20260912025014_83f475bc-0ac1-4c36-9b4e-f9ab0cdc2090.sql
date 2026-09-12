ALTER TABLE public.alert_deliveries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE;

ALTER TABLE public.alert_deliveries ALTER COLUMN job_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS alert_deliveries_alert_job_idx ON public.alert_deliveries (alert_id, job_id);
CREATE INDEX IF NOT EXISTS alert_deliveries_alert_shift_idx ON public.alert_deliveries (alert_id, shift_id);

GRANT ALL ON public.alert_deliveries TO service_role;