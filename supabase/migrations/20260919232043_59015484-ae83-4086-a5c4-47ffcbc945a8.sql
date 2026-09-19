-- Alert delivery reliability: attempt tracking + one logical row per alert/item/channel
ALTER TABLE public.alert_deliveries
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS alert_deliveries_shift_unique
  ON public.alert_deliveries (alert_id, shift_id, channel)
  WHERE shift_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS alert_deliveries_retry_idx
  ON public.alert_deliveries (status, last_attempt_at)
  WHERE status <> 'sent';