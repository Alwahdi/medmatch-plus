-- ============ 1) messages: system-owned id/created_at/receipts ============
REVOKE INSERT ON public.messages FROM authenticated;
GRANT INSERT (conversation_id, sender_id, body, attachment_path, attachment_name, attachment_type, attachment_size)
  ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

CREATE OR REPLACE FUNCTION public.guard_message_insert_receipts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
BEGIN
  -- الإيصالات تُكتب لاحقاً عبر مسارات موثوقة فقط (Phase73)، لا عند الإدراج.
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    NEW.read_at := NULL;
    NEW.delivered_at := NULL;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_guard_message_insert_receipts ON public.messages;
CREATE TRIGGER trg_guard_message_insert_receipts
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.guard_message_insert_receipts();

-- ============ 2) job_alerts: dispatcher owns last_sent_at ============
REVOKE INSERT, UPDATE ON public.job_alerts FROM authenticated;
GRANT INSERT (user_id, specialty_id, country, city, employment_type, channel, whatsapp_phone, is_active)
  ON public.job_alerts TO authenticated;
GRANT UPDATE (specialty_id, country, city, employment_type, channel, whatsapp_phone, is_active)
  ON public.job_alerts TO authenticated;
GRANT ALL ON public.job_alerts TO service_role;

CREATE OR REPLACE FUNCTION public.guard_job_alert_system_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.last_sent_at := NULL;
  ELSE
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.last_sent_at := OLD.last_sent_at;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_guard_job_alert_system_state ON public.job_alerts;
CREATE TRIGGER trg_guard_job_alert_system_state
BEFORE INSERT OR UPDATE ON public.job_alerts
FOR EACH ROW EXECUTE FUNCTION public.guard_job_alert_system_state();

-- ============ 3) profiles: no client-writable audit timestamps ============
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT INSERT (id, full_name, phone, country, city, avatar_url) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, country, city, avatar_url) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ============ 4) saved_jobs: create/delete only ============
REVOKE INSERT, UPDATE ON public.saved_jobs FROM authenticated;
GRANT INSERT (user_id, job_id) ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;