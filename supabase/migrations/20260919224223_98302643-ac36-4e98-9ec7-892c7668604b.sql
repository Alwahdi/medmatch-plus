CREATE OR REPLACE FUNCTION public.complete_interview(_interview_id uuid, _rating integer, _note text DEFAULT NULL::text, _reject boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_row public.interviews; v_note text;
BEGIN
  SELECT * INTO v_row FROM public.interviews WHERE id=_interview_id FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'INTERVIEW_NOT_FOUND'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.id=v_row.facility_id AND f.user_id=auth.uid()
  ) THEN
    RAISE EXCEPTION 'NOT_FACILITY_OWNER';
  END IF;
  IF v_row.status NOT IN ('scheduled','confirmed') THEN
    RAISE EXCEPTION 'INTERVIEW_NOT_PENDING';
  END IF;
  IF v_row.scheduled_at > now() THEN
    RAISE EXCEPTION 'INTERVIEW_NOT_STARTED';
  END IF;
  IF _rating IS NULL OR _rating < 1 OR _rating > 5 THEN
    RAISE EXCEPTION 'INTERVIEW_RATING_INVALID';
  END IF;

  v_note := NULLIF(btrim(COALESCE(_note,'')),'');
  IF v_note IS NOT NULL AND length(v_note) > 2000 THEN
    RAISE EXCEPTION 'INTERVIEW_NOTES_TOO_LONG';
  END IF;

  UPDATE public.interviews
     SET status='completed',
         outcome_rating=_rating,
         outcome_note=v_note,
         completed_at=now()
   WHERE id=_interview_id;

  IF _reject AND v_row.application_id IS NOT NULL THEN
    UPDATE public.applications
       SET status='rejected', updated_at=now()
     WHERE id=v_row.application_id AND status <> 'hired';
  END IF;

  PERFORM public.push_notification(
    v_row.professional_user_id,
    'interview',
    CASE WHEN _reject THEN 'انتهت المقابلة — لم يقع الاختيار عليك' ELSE 'انتهت المقابلة' END,
    CASE WHEN _reject THEN 'Interview finished — not selected' ELSE 'Interview finished' END,
    NULL, NULL, '/activity'
  );
END;
$function$;
GRANT EXECUTE ON FUNCTION public.complete_interview(uuid, integer, text, boolean) TO authenticated;