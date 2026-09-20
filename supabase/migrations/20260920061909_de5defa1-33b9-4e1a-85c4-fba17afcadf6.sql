CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_snapshot text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_deletion_requests_status_check') THEN
    ALTER TABLE public.account_deletion_requests
      ADD CONSTRAINT account_deletion_requests_status_check
      CHECK (status IN ('pending','cancelled','processing','completed','rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_deletion_requests_reason_check') THEN
    ALTER TABLE public.account_deletion_requests
      ADD CONSTRAINT account_deletion_requests_reason_check
      CHECK (reason IS NULL OR char_length(reason) <= 1000);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_requests_active_unique
  ON public.account_deletion_requests (user_id)
  WHERE status IN ('pending','processing');

GRANT SELECT ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "own deletion requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins read deletion requests" ON public.account_deletion_requests;
CREATE POLICY "admins read deletion requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "mfa level required" ON public.account_deletion_requests;
CREATE POLICY "mfa level required" ON public.account_deletion_requests
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_access_ok()))
  WITH CHECK ((select public.mfa_access_ok()));

DROP TRIGGER IF EXISTS set_account_deletion_requests_updated_at ON public.account_deletion_requests;
CREATE TRIGGER set_account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.request_account_deletion(_reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE _uid uuid; _email text; _clean text; _existing uuid; _new uuid;
BEGIN
  PERFORM public.require_mfa();
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT u.email INTO _email FROM auth.users u WHERE u.id = _uid;
  IF _email IS NULL THEN _email := 'unknown'; END IF;

  _clean := NULLIF(btrim(COALESCE(_reason, '')), '');
  IF _clean IS NOT NULL AND char_length(_clean) > 1000 THEN
    RAISE EXCEPTION 'REASON_TOO_LONG';
  END IF;

  SELECT id INTO _existing FROM public.account_deletion_requests
   WHERE user_id = _uid AND status IN ('pending','processing')
   LIMIT 1;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;

  INSERT INTO public.account_deletion_requests (user_id, email_snapshot, reason, status)
  VALUES (_uid, _email, _clean, 'pending')
  RETURNING id INTO _new;
  RETURN _new;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _status text;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT status INTO _status FROM public.account_deletion_requests
   WHERE id = _request_id AND user_id = auth.uid();
  IF _status IS NULL THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;
  IF _status <> 'pending' THEN RAISE EXCEPTION 'REQUEST_NOT_CANCELLABLE'; END IF;

  UPDATE public.account_deletion_requests
     SET status = 'cancelled', processed_at = now()
   WHERE id = _request_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_account_deletion(_request_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _current text;
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _status NOT IN ('processing','completed','rejected') THEN
    RAISE EXCEPTION 'INVALID_DELETION_STATUS';
  END IF;

  SELECT status INTO _current FROM public.account_deletion_requests WHERE id = _request_id;
  IF _current IS NULL THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;

  -- انتقالات مسموحة فقط: pending -> processing/rejected، processing -> completed/rejected.
  IF NOT (
    (_current = 'pending' AND _status IN ('processing','rejected')) OR
    (_current = 'processing' AND _status IN ('completed','rejected'))
  ) THEN
    RAISE EXCEPTION 'INVALID_DELETION_TRANSITION';
  END IF;

  UPDATE public.account_deletion_requests
     SET status = _status,
         admin_note = COALESCE(NULLIF(btrim(COALESCE(_note, '')), ''), admin_note),
         processed_at = CASE WHEN _status IN ('completed','rejected') THEN now() ELSE processed_at END
   WHERE id = _request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_account_deletion(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_account_deletion(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_account_deletion(uuid, text, text) TO authenticated, service_role;