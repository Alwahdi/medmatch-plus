-- Phase 81 (requested as Phase73; that label was already used)
-- Monotonic receipt invariant: read implies delivered, delivered <= read.

-- One-time backfill of pre-hardening rows. The receipt guard trigger blocks
-- non-recipient writes, so it is bypassed only for this maintenance statement.
ALTER TABLE public.messages DISABLE TRIGGER USER;
UPDATE public.messages
   SET delivered_at = read_at
 WHERE read_at IS NOT NULL
   AND (delivered_at IS NULL OR delivered_at > read_at);
ALTER TABLE public.messages ENABLE TRIGGER USER;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_receipt_order_ck;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_receipt_order_ck
  CHECK (read_at IS NULL OR (delivered_at IS NOT NULL AND delivered_at <= read_at))
  NOT VALID;
ALTER TABLE public.messages VALIDATE CONSTRAINT messages_receipt_order_ck;

-- Phase 60 explicit least-privilege re-assertion for messages and its receipt RPCs.
REVOKE ALL ON TABLE public.messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;

REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_incoming_messages_delivered() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_incoming_messages_delivered() TO authenticated, service_role;