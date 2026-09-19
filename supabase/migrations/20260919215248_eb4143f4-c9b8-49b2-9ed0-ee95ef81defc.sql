-- =========================================================
-- Phase 28 — authorization, workflow invariants, least privilege
-- Idempotent: safe to re-run.
-- =========================================================

-- 1) ROLES ------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  -- raw_user_meta_data is user-controlled: onboarding intent only, never authorization.
  RETURN NEW;
END; $$;

DROP POLICY IF EXISTS "self assign professional role" ON public.user_roles;
DROP POLICY IF EXISTS "self assign facility role" ON public.user_roles;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM authenticated, anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 2) PUBLIC LISTING VISIBILITY ----------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.can_read_job_row(_job_id uuid, _facility_id uuid, _is_active boolean, _expires_at timestamptz)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT (_is_active AND (_expires_at IS NULL OR _expires_at > now()))
  OR ((SELECT auth.uid()) IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=(SELECT auth.uid()) AND ur.role='admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id=_facility_id AND f.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id=_job_id AND a.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.saved_jobs sj WHERE sj.job_id=_job_id AND sj.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.job_id=_job_id AND i.professional_user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.job_id=_job_id AND c.professional_user_id=(SELECT auth.uid()))
  ));
$$;

CREATE OR REPLACE FUNCTION private.can_read_shift_row(_shift_id uuid, _facility_id uuid, _status public.shift_status, _starts_at timestamptz)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT (_status='open'::public.shift_status AND _starts_at > now())
  OR ((SELECT auth.uid()) IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=(SELECT auth.uid()) AND ur.role='admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id=_facility_id AND f.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.shift_id=_shift_id AND b.user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.shift_id=_shift_id AND i.professional_user_id=(SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.shift_id=_shift_id AND c.professional_user_id=(SELECT auth.uid()))
  ));
$$;

REVOKE ALL ON FUNCTION private.can_read_job_row(uuid,uuid,boolean,timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_read_shift_row(uuid,uuid,public.shift_status,timestamptz) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "jobs public read" ON public.jobs;
DROP POLICY IF EXISTS "jobs authenticated read" ON public.jobs;
CREATE POLICY "jobs public read" ON public.jobs FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "jobs authenticated read" ON public.jobs FOR SELECT TO authenticated
  USING (private.can_read_job_row(id, facility_id, is_active, expires_at));

DROP POLICY IF EXISTS "shifts public read" ON public.shifts;
DROP POLICY IF EXISTS "shifts authenticated read" ON public.shifts;
CREATE POLICY "shifts public read" ON public.shifts FOR SELECT TO anon
  USING (status = 'open'::public.shift_status AND starts_at > now());
CREATE POLICY "shifts authenticated read" ON public.shifts FOR SELECT TO authenticated
  USING (private.can_read_shift_row(id, facility_id, status, starts_at));

-- 3) start_candidate_conversation invariants --------------
CREATE OR REPLACE FUNCTION public.start_candidate_conversation(_professional_user_id uuid, _job_id uuid DEFAULT NULL, _shift_id uuid DEFAULT NULL, _subject text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _facility uuid; _conversation uuid; _allowed boolean; _subj text;
BEGIN
  IF _professional_user_id IS NULL THEN RAISE EXCEPTION 'CANDIDATE_REQUIRED'; END IF;
  IF num_nonnulls(_job_id, _shift_id) > 1 THEN RAISE EXCEPTION 'CONVERSATION_TARGET_INVALID'; END IF;

  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;

  IF _job_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = _job_id AND j.facility_id = _facility
  ) THEN RAISE EXCEPTION 'CONVERSATION_TARGET_INVALID'; END IF;

  IF _shift_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shifts s WHERE s.id = _shift_id AND s.facility_id = _facility
  ) THEN RAISE EXCEPTION 'CONVERSATION_TARGET_INVALID'; END IF;

  _subj := NULLIF(btrim(COALESCE(_subject,'')), '');
  IF _subj IS NOT NULL AND length(_subj) > 160 THEN RAISE EXCEPTION 'SUBJECT_TOO_LONG'; END IF;

  SELECT (
    EXISTS (SELECT 1 FROM public.candidate_search_access a WHERE a.facility_id=_facility AND a.professional_user_id=_professional_user_id)
    OR EXISTS (SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id=a.job_id
               WHERE j.facility_id=_facility AND a.user_id=_professional_user_id AND (_job_id IS NULL OR a.job_id=_job_id))
    OR EXISTS (SELECT 1 FROM public.shift_bookings b JOIN public.shifts s ON s.id=b.shift_id
               WHERE s.facility_id=_facility AND b.user_id=_professional_user_id AND (_shift_id IS NULL OR b.shift_id=_shift_id))
  ) INTO _allowed;
  IF NOT COALESCE(_allowed,false) THEN RAISE EXCEPTION 'CANDIDATE_CONTACT_NOT_ALLOWED'; END IF;

  SELECT c.id INTO _conversation FROM public.conversations c
  WHERE c.facility_id=_facility AND c.professional_user_id=_professional_user_id
    AND c.job_id IS NOT DISTINCT FROM _job_id AND c.shift_id IS NOT DISTINCT FROM _shift_id
  ORDER BY c.created_at DESC LIMIT 1;
  IF _conversation IS NOT NULL THEN RETURN _conversation; END IF;

  INSERT INTO public.conversations (facility_id, professional_user_id, job_id, shift_id, subject, identity_revealed)
  VALUES (_facility, _professional_user_id, _job_id, _shift_id, _subj, true)
  RETURNING id INTO _conversation;
  RETURN _conversation;
END; $$;

-- 4) INTERVIEW STATE MACHINE ------------------------------
CREATE OR REPLACE FUNCTION public.schedule_interview(_application_id uuid, _shift_booking_id uuid, _scheduled_at timestamptz, _duration_minutes integer DEFAULT 30, _mode text DEFAULT 'video', _location text DEFAULT NULL, _meeting_url text DEFAULT NULL, _notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_facility uuid; v_pro uuid; v_job uuid; v_shift uuid; v_title text; v_id uuid;
        v_app_status public.application_status; v_loc text; v_url text; v_notes text; v_dur int;
BEGIN
  IF _scheduled_at IS NULL OR _scheduled_at <= now() THEN RAISE EXCEPTION 'INTERVIEW_TIME_PAST'; END IF;
  IF _mode NOT IN ('video','phone','onsite') THEN RAISE EXCEPTION 'INTERVIEW_MODE_INVALID'; END IF;
  v_dur := COALESCE(_duration_minutes, 30);
  IF v_dur < 10 OR v_dur > 240 THEN RAISE EXCEPTION 'INTERVIEW_DURATION_INVALID'; END IF;

  v_loc   := NULLIF(btrim(COALESCE(_location,'')),'');
  v_url   := NULLIF(btrim(COALESCE(_meeting_url,'')),'');
  v_notes := NULLIF(btrim(COALESCE(_notes,'')),'');
  IF v_loc IS NOT NULL AND length(v_loc) > 200 THEN RAISE EXCEPTION 'INTERVIEW_LOCATION_TOO_LONG'; END IF;
  IF v_url IS NOT NULL AND length(v_url) > 500 THEN RAISE EXCEPTION 'INTERVIEW_URL_TOO_LONG'; END IF;
  IF v_notes IS NOT NULL AND length(v_notes) > 2000 THEN RAISE EXCEPTION 'INTERVIEW_NOTES_TOO_LONG'; END IF;
  IF _mode = 'onsite' AND v_loc IS NULL THEN RAISE EXCEPTION 'INTERVIEW_LOCATION_REQUIRED'; END IF;
  IF _mode = 'video' AND v_url IS NOT NULL AND v_url !~* '^https?://' THEN RAISE EXCEPTION 'INTERVIEW_URL_INVALID'; END IF;

  IF _application_id IS NOT NULL AND _shift_booking_id IS NOT NULL THEN RAISE EXCEPTION 'INTERVIEW_TARGET_INVALID'; END IF;

  IF _application_id IS NOT NULL THEN
    SELECT j.facility_id, a.user_id, j.id, j.title, a.status
      INTO v_facility, v_pro, v_job, v_title, v_app_status
      FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = _application_id;
    IF v_facility IS NULL THEN RAISE EXCEPTION 'APPLICATION_NOT_FOUND'; END IF;
    IF v_app_status NOT IN ('submitted','reviewing','shortlisted','interview') THEN
      RAISE EXCEPTION 'APPLICATION_NOT_INTERVIEWABLE';
    END IF;
  ELSIF _shift_booking_id IS NOT NULL THEN
    SELECT s.facility_id, b.user_id, s.id, s.title
      INTO v_facility, v_pro, v_shift, v_title
      FROM public.shift_bookings b JOIN public.shifts s ON s.id = b.shift_id
     WHERE b.id = _shift_booking_id AND b.status = 'confirmed';
    IF v_facility IS NULL THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND'; END IF;
  ELSE
    RAISE EXCEPTION 'INTERVIEW_TARGET_INVALID';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = v_facility AND f.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.interviews i
     WHERE i.status IN ('scheduled','confirmed')
       AND ((_application_id IS NOT NULL AND i.application_id = _application_id)
         OR (_shift_booking_id IS NOT NULL AND i.shift_booking_id = _shift_booking_id))
  ) THEN RAISE EXCEPTION 'INTERVIEW_ALREADY_SCHEDULED'; END IF;

  INSERT INTO public.interviews (application_id, shift_booking_id, facility_id, professional_user_id, job_id, shift_id,
    scheduled_at, duration_minutes, mode, location, meeting_url, notes)
  VALUES (_application_id, _shift_booking_id, v_facility, v_pro, v_job, v_shift,
    _scheduled_at, v_dur, _mode, v_loc, v_url, v_notes)
  RETURNING id INTO v_id;

  IF _application_id IS NOT NULL THEN
    UPDATE public.applications SET status='interview', updated_at=now()
     WHERE id=_application_id AND status NOT IN ('hired','rejected');
  END IF;

  PERFORM public.push_notification(v_pro, 'interview', 'تمت دعوتك لمقابلة', 'You have an interview invitation',
    'مقابلة بخصوص: ' || COALESCE(v_title,''), 'Interview for: ' || COALESCE(v_title,''), '/activity');
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.respond_to_interview(_interview_id uuid, _accept boolean, _note text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_row public.interviews; v_owner uuid; v_name text; v_status text; v_note text;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id=_interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF v_row.professional_user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_CANDIDATE'; END IF;
  IF v_row.status NOT IN ('scheduled','confirmed') THEN RAISE EXCEPTION 'INTERVIEW_NOT_PENDING'; END IF;
  IF v_row.scheduled_at + make_interval(mins => COALESCE(v_row.duration_minutes,30)) <= now() THEN
    RAISE EXCEPTION 'INTERVIEW_TIME_PAST';
  END IF;
  v_note := NULLIF(btrim(COALESCE(_note,'')),'');
  IF v_note IS NOT NULL AND length(v_note) > 1000 THEN RAISE EXCEPTION 'INTERVIEW_NOTES_TOO_LONG'; END IF;

  v_status := CASE WHEN _accept THEN 'confirmed' ELSE 'declined' END;
  UPDATE public.interviews SET status=v_status, candidate_note=v_note, responded_at=now() WHERE id=_interview_id;

  SELECT f.user_id INTO v_owner FROM public.facilities f WHERE f.id=v_row.facility_id;
  SELECT hp.full_name INTO v_name FROM public.healthcare_professionals hp WHERE hp.user_id=v_row.professional_user_id;
  IF v_owner IS NOT NULL THEN
    PERFORM public.push_notification(v_owner, 'interview',
      CASE WHEN _accept THEN 'تم تأكيد موعد المقابلة' ELSE 'اعتذر المرشح عن المقابلة' END,
      CASE WHEN _accept THEN 'Interview confirmed' ELSE 'Candidate declined the interview' END,
      COALESCE(v_name,'المرشح'), COALESCE(v_name,'The candidate'), '/facility');
  END IF;
  RETURN v_status;
END; $$;

CREATE OR REPLACE FUNCTION public.reschedule_interview(_interview_id uuid, _scheduled_at timestamptz, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_row public.interviews; v_notes text;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id=_interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.id=v_row.facility_id AND f.user_id=auth.uid()) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER';
  END IF;
  -- declined interviews may be re-proposed with a new time; cancelled/completed are terminal.
  IF v_row.status NOT IN ('scheduled','confirmed','declined') THEN RAISE EXCEPTION 'INTERVIEW_NOT_PENDING'; END IF;
  IF _scheduled_at IS NULL OR _scheduled_at <= now() THEN RAISE EXCEPTION 'INTERVIEW_TIME_PAST'; END IF;
  v_notes := NULLIF(btrim(COALESCE(_notes,'')),'');
  IF v_notes IS NOT NULL AND length(v_notes) > 2000 THEN RAISE EXCEPTION 'INTERVIEW_NOTES_TOO_LONG'; END IF;

  UPDATE public.interviews
     SET scheduled_at=_scheduled_at, status='scheduled', candidate_note=NULL, responded_at=NULL,
         notes=COALESCE(v_notes, notes)
   WHERE id=_interview_id;

  PERFORM public.push_notification(v_row.professional_user_id, 'interview',
    'تم تغيير موعد المقابلة', 'Interview rescheduled', NULL, NULL, '/activity');
END; $$;

CREATE OR REPLACE FUNCTION public.complete_interview(_interview_id uuid, _rating integer, _note text DEFAULT NULL, _reject boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_row public.interviews; v_note text;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id=_interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.id=v_row.facility_id AND f.user_id=auth.uid()) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER';
  END IF;
  IF v_row.status NOT IN ('scheduled','confirmed') THEN RAISE EXCEPTION 'INTERVIEW_NOT_PENDING'; END IF;
  IF _rating IS NULL OR _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'INTERVIEW_RATING_INVALID'; END IF;
  v_note := NULLIF(btrim(COALESCE(_note,'')),'');
  IF v_note IS NOT NULL AND length(v_note) > 2000 THEN RAISE EXCEPTION 'INTERVIEW_NOTES_TOO_LONG'; END IF;

  UPDATE public.interviews
     SET status='completed', outcome_rating=_rating, outcome_note=v_note, completed_at=now()
   WHERE id=_interview_id;

  IF _reject AND v_row.application_id IS NOT NULL THEN
    UPDATE public.applications SET status='rejected', updated_at=now()
     WHERE id=v_row.application_id AND status <> 'hired';
  END IF;

  PERFORM public.push_notification(v_row.professional_user_id, 'interview',
    CASE WHEN _reject THEN 'انتهت المقابلة — لم يقع الاختيار عليك' ELSE 'انتهت المقابلة' END,
    CASE WHEN _reject THEN 'Interview finished — not selected' ELSE 'Interview finished' END,
    NULL, NULL, '/activity');
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_interview(_interview_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_row public.interviews; v_owner uuid; v_is_owner boolean; v_reason text;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id=_interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  SELECT f.user_id INTO v_owner FROM public.facilities f WHERE f.id=v_row.facility_id;
  v_is_owner := v_owner = auth.uid();
  IF NOT v_is_owner AND v_row.professional_user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_PARTICIPANT'; END IF;
  IF v_row.status = 'completed' THEN RAISE EXCEPTION 'INTERVIEW_COMPLETED'; END IF;
  IF v_row.status = 'cancelled' THEN RAISE EXCEPTION 'INTERVIEW_CANCELLED'; END IF;
  v_reason := NULLIF(btrim(COALESCE(_reason,'')),'');
  IF v_reason IS NOT NULL AND length(v_reason) > 1000 THEN RAISE EXCEPTION 'INTERVIEW_NOTES_TOO_LONG'; END IF;

  UPDATE public.interviews SET status='cancelled', outcome_note=COALESCE(v_reason, outcome_note)
   WHERE id=_interview_id;

  IF v_is_owner THEN
    PERFORM public.push_notification(v_row.professional_user_id, 'interview',
      'تم إلغاء المقابلة', 'Interview cancelled', NULL, NULL, '/activity');
  ELSIF v_owner IS NOT NULL THEN
    PERFORM public.push_notification(v_owner, 'interview',
      'ألغى المرشح المقابلة', 'Candidate cancelled the interview', NULL, NULL, '/facility');
  END IF;
END; $$;

-- 5) HIRE / UNHIRE ----------------------------------------
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS auto_closed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.reset_job_auto_closed()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  -- any change of is_active that does not explicitly set auto_closed is a manual open/close
  IF NEW.is_active IS DISTINCT FROM OLD.is_active
     AND NEW.auto_closed IS NOT DISTINCT FROM OLD.auto_closed THEN
    NEW.auto_closed := false;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_reset_job_auto_closed ON public.jobs;
CREATE TRIGGER trg_reset_job_auto_closed BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.reset_job_auto_closed();

CREATE OR REPLACE FUNCTION public.hire_applicant(_application_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _job public.jobs%ROWTYPE; _owner uuid; _cur application_status; _hired int; _closed boolean := false; _r record;
BEGIN
  SELECT a.status INTO _cur FROM public.applications a WHERE a.id=_application_id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  SELECT j.* INTO _job FROM public.jobs j JOIN public.applications a ON a.job_id=j.id
   WHERE a.id=_application_id FOR UPDATE OF j;

  SELECT f.user_id INTO _owner FROM public.facilities f WHERE f.id=_job.facility_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _cur = 'hired' THEN RAISE EXCEPTION 'ALREADY_HIRED'; END IF;
  IF NOT _job.is_active THEN RAISE EXCEPTION 'JOB_CLOSED'; END IF;

  SELECT count(*) INTO _hired FROM public.applications WHERE job_id=_job.id AND status='hired';
  IF _hired >= GREATEST(_job.vacancies,1) THEN RAISE EXCEPTION 'VACANCIES_FILLED'; END IF;

  UPDATE public.applications SET status='hired' WHERE id=_application_id;
  _hired := _hired + 1;

  IF _hired >= GREATEST(_job.vacancies,1) THEN
    UPDATE public.jobs SET is_active=false, auto_closed=true WHERE id=_job.id;
    _closed := true;
    FOR _r IN SELECT id FROM public.applications WHERE job_id=_job.id AND status NOT IN ('hired','rejected') LOOP
      UPDATE public.applications SET status='rejected' WHERE id=_r.id;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('hired', _hired, 'vacancies', GREATEST(_job.vacancies,1), 'closed', _closed);
END; $$;

CREATE OR REPLACE FUNCTION public.unhire_applicant(_application_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _job public.jobs%ROWTYPE; _owner uuid; _cur application_status;
BEGIN
  SELECT a.status INTO _cur FROM public.applications a WHERE a.id=_application_id;
  IF _cur IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  SELECT j.* INTO _job FROM public.jobs j JOIN public.applications a ON a.job_id=j.id
   WHERE a.id=_application_id FOR UPDATE OF j;

  SELECT f.user_id INTO _owner FROM public.facilities f WHERE f.id=_job.facility_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _cur <> 'hired' THEN RAISE EXCEPTION 'NOT_HIRED'; END IF;

  IF NOT _job.is_active THEN
    IF _job.auto_closed THEN
      -- the job closed only because vacancies filled: undoing the hire reopens it
      UPDATE public.jobs SET is_active=true, auto_closed=false WHERE id=_job.id;
    ELSE
      RAISE EXCEPTION 'JOB_CLOSED_MANUALLY';
    END IF;
  END IF;

  UPDATE public.applications SET status='interview', updated_at=now() WHERE id=_application_id;
END; $$;

-- 6) LEAST-PRIVILEGE GRANTS -------------------------------
-- anon never writes anywhere in public
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon', t.relname);
  END LOOP;
END $$;

-- authenticated: no direct writes on RPC/trigger-managed tables
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.interviews, public.applications, public.shift_bookings, public.reviews,
  public.profile_change_log, public.specialties, public.subscription_plans,
  public.facility_subscriptions, public.alert_deliveries, public.candidate_search_access,
  public.candidate_search_requests, public.user_roles
FROM authenticated;

GRANT SELECT ON public.interviews, public.applications, public.shift_bookings, public.reviews,
  public.profile_change_log, public.specialties, public.subscription_plans,
  public.facility_subscriptions, public.user_roles TO authenticated;

-- contact inbox: admins may only flag messages as handled
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.contact_messages FROM authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT UPDATE (is_handled) ON public.contact_messages TO authenticated;

GRANT ALL ON public.interviews, public.applications, public.shift_bookings, public.reviews,
  public.profile_change_log, public.specialties, public.subscription_plans,
  public.facility_subscriptions, public.alert_deliveries, public.candidate_search_access,
  public.candidate_search_requests, public.contact_messages TO service_role;

-- 7) SECURITY DEFINER EXPOSURE ----------------------------
REVOKE ALL ON FUNCTION public.has_engagement(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.push_notification(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_job_auto_closed() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_candidate_conversation(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_interview(uuid, uuid, timestamptz, integer, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_interview(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_interview(uuid, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_interview(uuid, integer, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_interview(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hire_applicant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unhire_applicant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_professional_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_facility_role() TO authenticated;