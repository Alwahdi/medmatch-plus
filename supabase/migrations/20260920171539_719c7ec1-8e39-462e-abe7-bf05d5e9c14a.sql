-- Phase81: shift-linked interviews must fully precede an active future shift.

CREATE OR REPLACE FUNCTION private.assert_shift_interview_window(
  _shift_id uuid,
  _scheduled_at timestamptz,
  _duration_minutes integer
) RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_status text; v_starts timestamptz;
BEGIN
  IF _shift_id IS NULL THEN RETURN; END IF;

  SELECT s.status::text, s.starts_at INTO v_status, v_starts
    FROM public.shifts s WHERE s.id = _shift_id;

  IF v_status IS NULL OR v_status <> 'booked' OR v_starts <= now() THEN
    RAISE EXCEPTION 'SHIFT_UNAVAILABLE';
  END IF;

  IF _scheduled_at IS NULL
     OR _scheduled_at >= v_starts
     OR _scheduled_at + make_interval(mins => COALESCE(_duration_minutes, 30)) > v_starts THEN
    RAISE EXCEPTION 'SHIFT_INTERVIEW_WINDOW_INVALID';
  END IF;
END; $$;

REVOKE ALL ON FUNCTION private.assert_shift_interview_window(uuid, timestamptz, integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.schedule_interview(_application_id uuid, _shift_booking_id uuid, _scheduled_at timestamp with time zone, _duration_minutes integer DEFAULT 30, _mode text DEFAULT 'video'::text, _location text DEFAULT NULL::text, _meeting_url text DEFAULT NULL::text, _notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_facility uuid; v_pro uuid; v_job uuid; v_shift uuid; v_title text; v_id uuid;
  v_app_status public.application_status; v_loc text; v_url text; v_notes text; v_dur int;
BEGIN
  PERFORM public.require_mfa();
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

  IF _mode = 'onsite' THEN
    IF v_loc IS NULL THEN RAISE EXCEPTION 'INTERVIEW_LOCATION_REQUIRED'; END IF;
    v_url := NULL;
  ELSIF _mode = 'video' THEN
    IF v_url IS NULL THEN RAISE EXCEPTION 'INTERVIEW_URL_REQUIRED'; END IF;
    -- Phase81: HTTPS only; plain http meeting links are rejected.
    IF v_url !~* '^https://\S+$' THEN RAISE EXCEPTION 'INTERVIEW_URL_INVALID'; END IF;
    v_loc := NULL;
  ELSE
    -- Phone interviews need neither a meeting URL nor a physical location.
    v_url := NULL;
    v_loc := NULL;
  END IF;

  IF _application_id IS NOT NULL AND _shift_booking_id IS NOT NULL THEN
    RAISE EXCEPTION 'INTERVIEW_TARGET_INVALID';
  END IF;

  IF _application_id IS NOT NULL THEN
    SELECT j.facility_id, a.user_id, j.id, j.title, a.status
      INTO v_facility, v_pro, v_job, v_title, v_app_status
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = _application_id;

    IF v_facility IS NULL THEN RAISE EXCEPTION 'APPLICATION_NOT_FOUND'; END IF;
    IF v_app_status NOT IN ('submitted','reviewing','shortlisted','interview') THEN
      RAISE EXCEPTION 'APPLICATION_NOT_INTERVIEWABLE';
    END IF;
  ELSIF _shift_booking_id IS NOT NULL THEN
    SELECT s.facility_id, b.user_id, s.id, s.title
      INTO v_facility, v_pro, v_shift, v_title
      FROM public.shift_bookings b
      JOIN public.shifts s ON s.id = b.shift_id
     WHERE b.id = _shift_booking_id
       AND b.status = 'confirmed';

    IF v_facility IS NULL THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND'; END IF;
    -- Phase81: the shift must still be booked, in the future, and start after the interview ends.
    PERFORM private.assert_shift_interview_window(v_shift, _scheduled_at, v_dur);
  ELSE
    RAISE EXCEPTION 'INTERVIEW_TARGET_INVALID';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.id = v_facility AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.interviews i
    WHERE i.status IN ('scheduled','confirmed')
      AND (
        (_application_id IS NOT NULL AND i.application_id = _application_id)
        OR (_shift_booking_id IS NOT NULL AND i.shift_booking_id = _shift_booking_id)
      )
  ) THEN
    RAISE EXCEPTION 'INTERVIEW_ALREADY_SCHEDULED';
  END IF;

  INSERT INTO public.interviews (
    application_id, shift_booking_id, facility_id, professional_user_id,
    job_id, shift_id, scheduled_at, duration_minutes, mode,
    location, meeting_url, notes
  )
  VALUES (
    _application_id, _shift_booking_id, v_facility, v_pro,
    v_job, v_shift, _scheduled_at, v_dur, _mode,
    v_loc, v_url, v_notes
  )
  RETURNING id INTO v_id;

  IF _application_id IS NOT NULL THEN
    UPDATE public.applications
       SET status='interview', updated_at=now()
     WHERE id=_application_id
       AND status NOT IN ('hired','rejected');
  END IF;

  PERFORM public.push_notification(
    v_pro, 'interview',
    'تمت دعوتك لمقابلة', 'You have an interview invitation',
    'مقابلة بخصوص: ' || COALESCE(v_title,''),
    'Interview for: ' || COALESCE(v_title,''),
    '/activity'
  );

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reschedule_interview(_interview_id uuid, _scheduled_at timestamp with time zone, _notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_row public.interviews; v_notes text;
BEGIN
  PERFORM public.require_mfa();
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

  -- Phase81: shift-linked interviews keep the same window rule on every new time.
  IF v_row.shift_id IS NOT NULL OR v_row.shift_booking_id IS NOT NULL THEN
    IF v_row.shift_booking_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.shift_bookings b WHERE b.id = v_row.shift_booking_id AND b.status = 'confirmed'
    ) THEN
      RAISE EXCEPTION 'SHIFT_UNAVAILABLE';
    END IF;
    PERFORM private.assert_shift_interview_window(
      COALESCE(v_row.shift_id, (SELECT b.shift_id FROM public.shift_bookings b WHERE b.id = v_row.shift_booking_id)),
      _scheduled_at,
      COALESCE(v_row.duration_minutes, 30)
    );
  END IF;

  UPDATE public.interviews
     SET scheduled_at=_scheduled_at, status='scheduled', candidate_note=NULL, responded_at=NULL,
         notes=COALESCE(v_notes, notes)
   WHERE id=_interview_id;

  PERFORM public.push_notification(v_row.professional_user_id, 'interview',
    'تم تغيير موعد المقابلة', 'Interview rescheduled', NULL, NULL, '/activity');
END; $function$;

CREATE OR REPLACE FUNCTION public.respond_to_interview(_interview_id uuid, _accept boolean, _note text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_row public.interviews; v_owner uuid; v_name text; v_status text; v_note text;
BEGIN
  PERFORM public.require_mfa();
  SELECT * INTO v_row FROM public.interviews WHERE id=_interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF v_row.professional_user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_CANDIDATE'; END IF;
  IF v_row.status NOT IN ('scheduled','confirmed') THEN RAISE EXCEPTION 'INTERVIEW_NOT_PENDING'; END IF;
  IF v_row.scheduled_at + make_interval(mins => COALESCE(v_row.duration_minutes,30)) <= now() THEN
    RAISE EXCEPTION 'INTERVIEW_TIME_PAST';
  END IF;
  v_note := NULLIF(btrim(COALESCE(_note,'')),'');
  IF v_note IS NOT NULL AND length(v_note) > 1000 THEN RAISE EXCEPTION 'INTERVIEW_NOTES_TOO_LONG'; END IF;

  -- Phase81: accepting requires the linked shift to still be live; declining stays allowed for history.
  IF _accept AND (v_row.shift_id IS NOT NULL OR v_row.shift_booking_id IS NOT NULL) THEN
    IF v_row.shift_booking_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.shift_bookings b WHERE b.id = v_row.shift_booking_id AND b.status = 'confirmed'
    ) THEN
      RAISE EXCEPTION 'SHIFT_UNAVAILABLE';
    END IF;
    PERFORM private.assert_shift_interview_window(
      COALESCE(v_row.shift_id, (SELECT b.shift_id FROM public.shift_bookings b WHERE b.id = v_row.shift_booking_id)),
      v_row.scheduled_at,
      COALESCE(v_row.duration_minutes, 30)
    );
  END IF;

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
END; $function$;

REVOKE ALL ON FUNCTION public.schedule_interview(uuid, uuid, timestamptz, integer, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reschedule_interview(uuid, timestamptz, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_interview(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.schedule_interview(uuid, uuid, timestamptz, integer, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reschedule_interview(uuid, timestamptz, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_interview(uuid, boolean, text) TO authenticated, service_role;