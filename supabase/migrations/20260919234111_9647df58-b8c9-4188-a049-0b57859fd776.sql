-- Phase 48 — shift state invariants + review-after-completion (idempotent)

CREATE OR REPLACE FUNCTION public.enforce_shift_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('cancelled','completed') THEN
    RAISE EXCEPTION 'SHIFT_FINAL_STATE';
  END IF;

  IF OLD.status = 'open' AND NEW.status = 'booked' THEN
    IF NEW.booked_by IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM public.shift_bookings b
         WHERE b.shift_id = OLD.id
           AND b.user_id = NEW.booked_by
           AND b.status = 'confirmed'
       ) THEN
      RAISE EXCEPTION 'SHIFT_BOOKING_INVARIANT';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'open' AND NEW.status = 'cancelled' THEN
    IF NEW.booked_by IS NOT NULL
       OR EXISTS (
         SELECT 1 FROM public.shift_bookings b
         WHERE b.shift_id = OLD.id
           AND b.status = 'confirmed'
       ) THEN
      RAISE EXCEPTION 'SHIFT_HAS_ACTIVE_BOOKING';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'booked' AND NEW.status = 'open' THEN
    IF NEW.booked_by IS NOT NULL
       OR EXISTS (
         SELECT 1 FROM public.shift_bookings b
         WHERE b.shift_id = OLD.id
           AND b.status = 'confirmed'
       ) THEN
      RAISE EXCEPTION 'SHIFT_BOOKING_INVARIANT';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'booked' AND NEW.status = 'completed' THEN
    IF OLD.ends_at > now()
       OR NEW.booked_by IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM public.shift_bookings b
         WHERE b.shift_id = OLD.id
           AND b.user_id = NEW.booked_by
           AND b.status = 'confirmed'
       ) THEN
      RAISE EXCEPTION 'SHIFT_NOT_COMPLETABLE';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'INVALID_SHIFT_TRANSITION';
END;
$function$;

DROP TRIGGER IF EXISTS enforce_shift_status_transition ON public.shifts;
CREATE TRIGGER enforce_shift_status_transition
BEFORE UPDATE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.enforce_shift_status_transition();

REVOKE ALL ON FUNCTION public.enforce_shift_status_transition() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.has_engagement(_facility_id uuid, _professional_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.facility_id = _facility_id
      AND a.user_id = _professional_user_id
      AND a.status = 'hired'
  )
  OR EXISTS (
    SELECT 1
    FROM public.shift_bookings b
    JOIN public.shifts s ON s.id = b.shift_id
    WHERE s.facility_id = _facility_id
      AND b.user_id = _professional_user_id
      AND b.status = 'confirmed'
      AND s.status = 'completed'
  );
$function$;

CREATE OR REPLACE FUNCTION public.save_engagement_review(
  _direction review_direction,
  _facility_id uuid,
  _professional_user_id uuid,
  _rating integer,
  _comment text DEFAULT NULL::text,
  _job_id uuid DEFAULT NULL::uuid,
  _shift_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _review_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF _rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'INVALID_RATING'; END IF;
  IF length(COALESCE(_comment, '')) > 800 THEN RAISE EXCEPTION 'COMMENT_TOO_LONG'; END IF;
  IF NOT public.has_engagement(_facility_id, _professional_user_id) THEN
    RAISE EXCEPTION 'ENGAGEMENT_REQUIRED';
  END IF;

  IF _direction = 'pro_to_facility' THEN
    IF auth.uid() <> _professional_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  ELSIF _direction = 'facility_to_pro' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = _facility_id AND f.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_DIRECTION';
  END IF;

  IF _job_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.job_id = _job_id
      AND a.user_id = _professional_user_id
      AND j.facility_id = _facility_id
      AND a.status = 'hired'
  ) THEN
    RAISE EXCEPTION 'INVALID_JOB_ENGAGEMENT';
  END IF;

  IF _shift_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.shift_bookings b
    JOIN public.shifts s ON s.id = b.shift_id
    WHERE b.shift_id = _shift_id
      AND b.user_id = _professional_user_id
      AND s.facility_id = _facility_id
      AND b.status = 'confirmed'
      AND s.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'INVALID_SHIFT_ENGAGEMENT';
  END IF;

  INSERT INTO public.reviews (
    direction, facility_id, professional_user_id, author_user_id,
    rating, comment, job_id, shift_id
  ) VALUES (
    _direction, _facility_id, _professional_user_id, auth.uid(),
    _rating, NULLIF(btrim(_comment), ''), _job_id, _shift_id
  )
  ON CONFLICT (direction, facility_id, professional_user_id)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    job_id = EXCLUDED.job_id,
    shift_id = EXCLUDED.shift_id,
    updated_at = now()
  WHERE public.reviews.author_user_id = auth.uid()
  RETURNING id INTO _review_id;

  IF _review_id IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  RETURN _review_id;
END;
$function$;

-- Atomic facility-side cancellation: never leaves an orphaned booking behind.
CREATE OR REPLACE FUNCTION public.cancel_facility_shift(_shift_id uuid, _reason text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _status shift_status;
  _facility_id uuid;
  _title text;
  _pro uuid;
  _reason_clean text := NULLIF(btrim(COALESCE(_reason, '')), '');
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF length(COALESCE(_reason_clean, '')) > 300 THEN RAISE EXCEPTION 'REASON_TOO_LONG'; END IF;

  SELECT s.status, s.facility_id, s.title
    INTO _status, _facility_id, _title
  FROM public.shifts s
  WHERE s.id = _shift_id
  FOR UPDATE;

  IF _facility_id IS NULL THEN RAISE EXCEPTION 'SHIFT_NOT_FOUND'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.id = _facility_id AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF _status = 'cancelled' THEN
    RETURN _shift_id; -- idempotent
  END IF;

  IF _status = 'completed' THEN
    RAISE EXCEPTION 'SHIFT_FINAL_STATE';
  END IF;

  SELECT b.user_id INTO _pro
  FROM public.shift_bookings b
  WHERE b.shift_id = _shift_id AND b.status = 'confirmed'
  LIMIT 1;

  -- Removing the booking releases the shift back to 'open' via sync_shift_status_on_booking.
  DELETE FROM public.shift_bookings WHERE shift_id = _shift_id;

  UPDATE public.shifts
  SET status = 'cancelled', booked_by = NULL, updated_at = now()
  WHERE id = _shift_id;

  IF _pro IS NOT NULL THEN
    PERFORM public.push_notification(
      _pro,
      'shift_cancelled',
      'أُلغيت مناوبة كنت قد حجزتها',
      'A shift you booked was cancelled',
      COALESCE(_title, '') || CASE WHEN _reason_clean IS NULL THEN '' ELSE ' — ' || _reason_clean END,
      COALESCE(_title, '') || CASE WHEN _reason_clean IS NULL THEN '' ELSE ' — ' || _reason_clean END,
      '/my-shifts'
    );
  END IF;

  RETURN _shift_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_facility_shift(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_facility_shift(uuid, text) TO authenticated, service_role;
