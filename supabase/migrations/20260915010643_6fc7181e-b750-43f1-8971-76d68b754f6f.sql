CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  shift_booking_id uuid REFERENCES public.shift_bookings(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  professional_user_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  mode text NOT NULL DEFAULT 'video',
  location text,
  meeting_url text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  candidate_note text,
  responded_at timestamptz,
  outcome_rating integer,
  outcome_note text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interviews_target_ck CHECK (
    (application_id IS NOT NULL AND shift_booking_id IS NULL)
    OR (application_id IS NULL AND shift_booking_id IS NOT NULL)
  ),
  CONSTRAINT interviews_mode_ck CHECK (mode IN ('video','phone','onsite')),
  CONSTRAINT interviews_status_ck CHECK (status IN ('scheduled','confirmed','declined','cancelled','completed')),
  CONSTRAINT interviews_duration_ck CHECK (duration_minutes BETWEEN 10 AND 240),
  CONSTRAINT interviews_rating_ck CHECK (outcome_rating IS NULL OR outcome_rating BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX interviews_active_application_idx
  ON public.interviews (application_id)
  WHERE application_id IS NOT NULL AND status IN ('scheduled','confirmed');
CREATE UNIQUE INDEX interviews_active_booking_idx
  ON public.interviews (shift_booking_id)
  WHERE shift_booking_id IS NOT NULL AND status IN ('scheduled','confirmed');
CREATE INDEX interviews_pro_idx ON public.interviews (professional_user_id, scheduled_at DESC);
CREATE INDEX interviews_facility_idx ON public.interviews (facility_id, scheduled_at DESC);

GRANT SELECT ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facility owner reads its interviews"
ON public.interviews FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = interviews.facility_id AND f.user_id = auth.uid()));

CREATE POLICY "Candidate reads own interviews"
ON public.interviews FOR SELECT TO authenticated
USING (professional_user_id = auth.uid());

CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- جدولة مقابلة
CREATE OR REPLACE FUNCTION public.schedule_interview(
  _application_id uuid,
  _shift_booking_id uuid,
  _scheduled_at timestamptz,
  _duration_minutes integer DEFAULT 30,
  _mode text DEFAULT 'video',
  _location text DEFAULT NULL,
  _meeting_url text DEFAULT NULL,
  _notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_facility uuid; v_pro uuid; v_job uuid; v_shift uuid; v_title text; v_id uuid;
BEGIN
  IF _scheduled_at IS NULL OR _scheduled_at <= now() THEN
    RAISE EXCEPTION 'INTERVIEW_TIME_PAST';
  END IF;
  IF _mode NOT IN ('video','phone','onsite') THEN
    RAISE EXCEPTION 'INTERVIEW_MODE_INVALID';
  END IF;

  IF _application_id IS NOT NULL AND _shift_booking_id IS NOT NULL THEN
    RAISE EXCEPTION 'INTERVIEW_TARGET_INVALID';
  END IF;

  IF _application_id IS NOT NULL THEN
    SELECT j.facility_id, a.user_id, j.id, j.title
      INTO v_facility, v_pro, v_job, v_title
      FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = _application_id;
    IF v_facility IS NULL THEN RAISE EXCEPTION 'APPLICATION_NOT_FOUND'; END IF;
  ELSIF _shift_booking_id IS NOT NULL THEN
    SELECT s.facility_id, b.user_id, s.id, s.title
      INTO v_facility, v_pro, v_shift, v_title
      FROM public.shift_bookings b JOIN public.shifts s ON s.id = b.shift_id
     WHERE b.id = _shift_booking_id AND b.status <> 'cancelled';
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
  ) THEN
    RAISE EXCEPTION 'INTERVIEW_ALREADY_SCHEDULED';
  END IF;

  INSERT INTO public.interviews (
    application_id, shift_booking_id, facility_id, professional_user_id, job_id, shift_id,
    scheduled_at, duration_minutes, mode, location, meeting_url, notes
  ) VALUES (
    _application_id, _shift_booking_id, v_facility, v_pro, v_job, v_shift,
    _scheduled_at, COALESCE(_duration_minutes, 30), _mode,
    NULLIF(btrim(COALESCE(_location,'')),''), NULLIF(btrim(COALESCE(_meeting_url,'')),''),
    NULLIF(btrim(COALESCE(_notes,'')),'')
  ) RETURNING id INTO v_id;

  IF _application_id IS NOT NULL THEN
    UPDATE public.applications
       SET status = 'interview', updated_at = now()
     WHERE id = _application_id AND status NOT IN ('hired','rejected');
  END IF;

  PERFORM public.push_notification(
    v_pro, 'interview',
    'تمت دعوتك لمقابلة', 'You have an interview invitation',
    'مقابلة بخصوص: ' || COALESCE(v_title,''), 'Interview for: ' || COALESCE(v_title,''),
    '/activity'
  );

  RETURN v_id;
END; $$;

-- ردّ المرشح
CREATE OR REPLACE FUNCTION public.respond_to_interview(_interview_id uuid, _accept boolean, _note text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.interviews; v_owner uuid; v_name text; v_status text;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id = _interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF v_row.professional_user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_CANDIDATE'; END IF;
  IF v_row.status NOT IN ('scheduled','confirmed') THEN RAISE EXCEPTION 'INTERVIEW_NOT_PENDING'; END IF;

  v_status := CASE WHEN _accept THEN 'confirmed' ELSE 'declined' END;
  UPDATE public.interviews
     SET status = v_status, candidate_note = NULLIF(btrim(COALESCE(_note,'')),''), responded_at = now()
   WHERE id = _interview_id;

  SELECT f.user_id INTO v_owner FROM public.facilities f WHERE f.id = v_row.facility_id;
  SELECT hp.full_name INTO v_name FROM public.healthcare_professionals hp WHERE hp.user_id = v_row.professional_user_id;

  IF v_owner IS NOT NULL THEN
    PERFORM public.push_notification(
      v_owner, 'interview',
      CASE WHEN _accept THEN 'تم تأكيد موعد المقابلة' ELSE 'اعتذر المرشح عن المقابلة' END,
      CASE WHEN _accept THEN 'Interview confirmed' ELSE 'Candidate declined the interview' END,
      COALESCE(v_name,'المرشح'), COALESCE(v_name,'The candidate'),
      '/facility'
    );
  END IF;

  RETURN v_status;
END; $$;

-- إعادة الجدولة
CREATE OR REPLACE FUNCTION public.reschedule_interview(_interview_id uuid, _scheduled_at timestamptz, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.interviews;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id = _interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = v_row.facility_id AND f.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER';
  END IF;
  IF v_row.status NOT IN ('scheduled','confirmed','declined') THEN RAISE EXCEPTION 'INTERVIEW_NOT_PENDING'; END IF;
  IF _scheduled_at IS NULL OR _scheduled_at <= now() THEN RAISE EXCEPTION 'INTERVIEW_TIME_PAST'; END IF;

  UPDATE public.interviews
     SET scheduled_at = _scheduled_at,
         status = 'scheduled',
         candidate_note = NULL,
         responded_at = NULL,
         notes = COALESCE(NULLIF(btrim(COALESCE(_notes,'')),''), notes)
   WHERE id = _interview_id;

  PERFORM public.push_notification(
    v_row.professional_user_id, 'interview',
    'تم تغيير موعد المقابلة', 'Interview rescheduled',
    NULL, NULL, '/activity'
  );
END; $$;

-- إلغاء المقابلة
CREATE OR REPLACE FUNCTION public.cancel_interview(_interview_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.interviews; v_owner uuid; v_is_owner boolean;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id = _interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  SELECT f.user_id INTO v_owner FROM public.facilities f WHERE f.id = v_row.facility_id;
  v_is_owner := v_owner = auth.uid();
  IF NOT v_is_owner AND v_row.professional_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'NOT_PARTICIPANT';
  END IF;
  IF v_row.status = 'completed' THEN RAISE EXCEPTION 'INTERVIEW_COMPLETED'; END IF;

  UPDATE public.interviews
     SET status = 'cancelled',
         outcome_note = COALESCE(NULLIF(btrim(COALESCE(_reason,'')),''), outcome_note)
   WHERE id = _interview_id;

  IF v_is_owner THEN
    PERFORM public.push_notification(
      v_row.professional_user_id, 'interview',
      'تم إلغاء المقابلة', 'Interview cancelled', NULL, NULL, '/activity');
  ELSIF v_owner IS NOT NULL THEN
    PERFORM public.push_notification(
      v_owner, 'interview',
      'ألغى المرشح المقابلة', 'Candidate cancelled the interview', NULL, NULL, '/facility');
  END IF;
END; $$;

-- إنهاء المقابلة وتسجيل التقييم
CREATE OR REPLACE FUNCTION public.complete_interview(
  _interview_id uuid,
  _rating integer,
  _note text DEFAULT NULL,
  _reject boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.interviews;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id = _interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = v_row.facility_id AND f.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER';
  END IF;
  IF v_row.status = 'completed' THEN RAISE EXCEPTION 'INTERVIEW_COMPLETED'; END IF;
  IF _rating IS NULL OR _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'INTERVIEW_RATING_INVALID'; END IF;

  UPDATE public.interviews
     SET status = 'completed',
         outcome_rating = _rating,
         outcome_note = NULLIF(btrim(COALESCE(_note,'')),''),
         completed_at = now()
   WHERE id = _interview_id;

  IF _reject AND v_row.application_id IS NOT NULL THEN
    UPDATE public.applications
       SET status = 'rejected', updated_at = now()
     WHERE id = v_row.application_id AND status <> 'hired';
  END IF;

  PERFORM public.push_notification(
    v_row.professional_user_id, 'interview',
    CASE WHEN _reject THEN 'انتهت المقابلة — لم يقع الاختيار عليك' ELSE 'انتهت المقابلة' END,
    CASE WHEN _reject THEN 'Interview finished — not selected' ELSE 'Interview finished' END,
    NULL, NULL, '/activity'
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.schedule_interview(uuid, uuid, timestamptz, integer, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.respond_to_interview(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reschedule_interview(uuid, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_interview(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_interview(uuid, integer, text, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.schedule_interview(uuid, uuid, timestamptz, integer, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_interview(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_interview(uuid, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_interview(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_interview(uuid, integer, text, boolean) TO authenticated;