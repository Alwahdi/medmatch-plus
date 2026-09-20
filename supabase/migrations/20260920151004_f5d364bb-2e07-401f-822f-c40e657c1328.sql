-- Phase 71: make the alert delivery ledger duplicate-proof under concurrency.
-- The plain UNIQUE (alert_id, job_id, channel) does not constrain shift rows
-- (job_id IS NULL makes rows distinct in Postgres), so replace it with an
-- explicit partial unique index per target kind.
ALTER TABLE public.alert_deliveries
  DROP CONSTRAINT IF EXISTS alert_deliveries_alert_id_job_id_channel_key;

CREATE UNIQUE INDEX IF NOT EXISTS alert_deliveries_job_unique
  ON public.alert_deliveries (alert_id, job_id, channel)
  WHERE job_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS alert_deliveries_shift_unique
  ON public.alert_deliveries (alert_id, shift_id, channel)
  WHERE shift_id IS NOT NULL;

-- Exactly one target per delivery row.
ALTER TABLE public.alert_deliveries
  DROP CONSTRAINT IF EXISTS alert_deliveries_target_ck;
ALTER TABLE public.alert_deliveries
  ADD CONSTRAINT alert_deliveries_target_ck
  CHECK ((job_id IS NOT NULL) <> (shift_id IS NOT NULL)) NOT VALID;
ALTER TABLE public.alert_deliveries VALIDATE CONSTRAINT alert_deliveries_target_ck;

-- Allowed delivery states, including the transient claim state used to stop
-- two concurrent dispatch runs from sending the same message twice.
ALTER TABLE public.alert_deliveries
  DROP CONSTRAINT IF EXISTS alert_deliveries_status_ck;
ALTER TABLE public.alert_deliveries
  ADD CONSTRAINT alert_deliveries_status_ck
  CHECK (status IN ('sent','failed','not_configured','processing')) NOT VALID;
ALTER TABLE public.alert_deliveries VALIDATE CONSTRAINT alert_deliveries_status_ck;

-- Phase 60 privilege rule: the ledger is server-managed only.
REVOKE ALL ON public.alert_deliveries FROM anon, authenticated;
GRANT SELECT ON public.alert_deliveries TO authenticated;
GRANT ALL ON public.alert_deliveries TO service_role;