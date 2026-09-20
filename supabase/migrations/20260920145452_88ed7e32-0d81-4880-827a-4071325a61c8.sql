-- Phase 68 — Minimal Trust & Safety reporting workflow

CREATE TABLE IF NOT EXISTS public.safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  category text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

DO $$ BEGIN
  ALTER TABLE public.safety_reports
    ADD CONSTRAINT safety_reports_target_type_ck CHECK (target_type IN ('job','shift','conversation','message'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.safety_reports
    ADD CONSTRAINT safety_reports_category_ck CHECK (category IN ('misleading','fraud_or_fee','harassment','privacy','unsafe_content','other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.safety_reports
    ADD CONSTRAINT safety_reports_status_ck CHECK (status IN ('open','reviewing','resolved','dismissed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.safety_reports
    ADD CONSTRAINT safety_reports_details_ck CHECK (details IS NULL OR char_length(details) <= 1000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS safety_reports_open_unique
  ON public.safety_reports (reporter_user_id, target_type, target_id, category)
  WHERE status IN ('open','reviewing');

CREATE INDEX IF NOT EXISTS safety_reports_status_created_idx
  ON public.safety_reports (status, created_at DESC);

DROP TRIGGER IF EXISTS set_safety_reports_updated_at ON public.safety_reports;
CREATE TRIGGER set_safety_reports_updated_at
  BEFORE UPDATE ON public.safety_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 60: explicit least-privilege grants (default privileges cannot be relied on)
REVOKE ALL ON public.safety_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.safety_reports TO authenticated;
GRANT ALL ON public.safety_reports TO service_role;

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own safety reports" ON public.safety_reports;
CREATE POLICY "own safety reports" ON public.safety_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid());

DROP POLICY IF EXISTS "admins read safety reports" ON public.safety_reports;
CREATE POLICY "admins read safety reports" ON public.safety_reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "mfa level required" ON public.safety_reports;
CREATE POLICY "mfa level required" ON public.safety_reports
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.mfa_access_ok()))
  WITH CHECK ((SELECT public.mfa_access_ok()));

-- ---------------------------------------------------------------- submit RPC
CREATE OR REPLACE FUNCTION public.submit_safety_report(
  _target_type text,
  _target_id uuid,
  _category text,
  _details text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _uid uuid; _clean text; _existing uuid; _new uuid; _visible boolean := false; _count int;
BEGIN
  PERFORM public.require_mfa();
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  IF _target_type NOT IN ('job','shift','conversation','message') THEN
    RAISE EXCEPTION 'INVALID_REPORT_TARGET';
  END IF;
  IF _category NOT IN ('misleading','fraud_or_fee','harassment','privacy','unsafe_content','other') THEN
    RAISE EXCEPTION 'INVALID_REPORT_CATEGORY';
  END IF;

  _clean := NULLIF(btrim(COALESCE(_details, '')), '');
  IF _clean IS NOT NULL AND char_length(_clean) > 1000 THEN
    RAISE EXCEPTION 'REPORT_DETAILS_TOO_LONG';
  END IF;

  -- المُبلِّغ يجب أن يملك رؤية مشروعة للعنصر
  IF _target_type = 'job' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = _target_id
        AND (
          j.is_active
          OR EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id = j.id AND a.user_id = _uid)
          OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.job_id = j.id AND i.professional_user_id = _uid)
        )
    ) INTO _visible;
  ELSIF _target_type = 'shift' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = _target_id
        AND (
          s.status = 'open'
          OR EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.shift_id = s.id AND b.user_id = _uid)
          OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.shift_id = s.id AND i.professional_user_id = _uid)
        )
    ) INTO _visible;
  ELSIF _target_type = 'conversation' THEN
    _visible := public.is_conversation_participant(_target_id, _uid);
  ELSIF _target_type = 'message' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = _target_id
        AND public.is_conversation_participant(m.conversation_id, _uid)
    ) INTO _visible;
  END IF;

  IF NOT COALESCE(_visible, false) THEN
    RAISE EXCEPTION 'REPORT_TARGET_NOT_VISIBLE';
  END IF;

  -- منع التكرار: بلاغ مفتوح بنفس التصنيف على نفس العنصر
  SELECT id INTO _existing FROM public.safety_reports
   WHERE reporter_user_id = _uid
     AND target_type = _target_type
     AND target_id = _target_id
     AND category = _category
     AND status IN ('open','reviewing')
   LIMIT 1;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;

  -- حصة يومية (20) بشكل ذرّي لكل مستخدم
  PERFORM pg_advisory_xact_lock(hashtext('public.safety_reports.submit:' || _uid::text));

  SELECT count(*) INTO _count FROM public.safety_reports
   WHERE reporter_user_id = _uid AND created_at > now() - interval '1 day';
  IF _count >= 20 THEN RAISE EXCEPTION 'REPORT_QUOTA_EXCEEDED'; END IF;

  INSERT INTO public.safety_reports (reporter_user_id, target_type, target_id, category, details)
  VALUES (_uid, _target_type, _target_id, _category, _clean)
  RETURNING id INTO _new;

  RETURN _new;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_safety_report(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_safety_report(text, uuid, text, text) TO authenticated, service_role;

-- ---------------------------------------------------------------- admin RPCs
CREATE OR REPLACE FUNCTION public.admin_list_safety_reports(_status text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  target_type text,
  target_id uuid,
  category text,
  details text,
  status text,
  admin_note text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  target_label text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;

  RETURN QUERY
  SELECT r.id, r.target_type, r.target_id, r.category, r.details, r.status, r.admin_note,
         r.created_at, r.updated_at, r.resolved_at,
         CASE r.target_type
           WHEN 'job' THEN (SELECT j.title FROM public.jobs j WHERE j.id = r.target_id)
           WHEN 'shift' THEN (SELECT s.title FROM public.shifts s WHERE s.id = r.target_id)
           WHEN 'conversation' THEN (SELECT c.subject FROM public.conversations c WHERE c.id = r.target_id)
           WHEN 'message' THEN (
             SELECT c.subject FROM public.messages m
             JOIN public.conversations c ON c.id = m.conversation_id
             WHERE m.id = r.target_id
           )
         END
    FROM public.safety_reports r
   WHERE (_status IS NULL OR r.status = _status)
   ORDER BY (r.status = 'open') DESC, r.created_at DESC
   LIMIT 200;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_safety_reports(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_safety_reports(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_update_safety_report(_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _current text;
BEGIN
  PERFORM public.require_mfa();
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _status NOT IN ('reviewing','resolved','dismissed') THEN
    RAISE EXCEPTION 'INVALID_REPORT_STATUS';
  END IF;

  SELECT status INTO _current FROM public.safety_reports WHERE id = _id;
  IF _current IS NULL THEN RAISE EXCEPTION 'REPORT_NOT_FOUND'; END IF;

  IF NOT (
    (_current = 'open' AND _status IN ('reviewing','resolved','dismissed')) OR
    (_current = 'reviewing' AND _status IN ('resolved','dismissed'))
  ) THEN
    RAISE EXCEPTION 'INVALID_REPORT_TRANSITION';
  END IF;

  UPDATE public.safety_reports
     SET status = _status,
         admin_note = COALESCE(NULLIF(btrim(COALESCE(_note, '')), ''), admin_note),
         resolved_at = CASE WHEN _status IN ('resolved','dismissed') THEN now() ELSE resolved_at END
   WHERE id = _id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_safety_report(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_safety_report(uuid, text, text) TO authenticated, service_role;