-- Phase 57: preserve shift booking cancellation history.

ALTER TABLE public.shift_bookings
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_actor text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.shift_bookings DROP CONSTRAINT IF EXISTS shift_bookings_status_ck;
ALTER TABLE public.shift_bookings
  ADD CONSTRAINT shift_bookings_status_ck CHECK (status IN ('confirmed','cancelled'));

ALTER TABLE public.shift_bookings DROP CONSTRAINT IF EXISTS shift_bookings_cancel_ck;
ALTER TABLE public.shift_bookings
  ADD CONSTRAINT shift_bookings_cancel_ck CHECK (
    (status = 'confirmed' AND cancelled_at IS NULL AND cancellation_actor IS NULL AND cancellation_reason IS NULL)
    OR (status = 'cancelled'
        AND cancelled_at IS NOT NULL
        AND cancellation_actor IN ('professional','facility','system')
        AND (cancellation_reason IS NULL OR length(cancellation_reason) <= 500))
  );

ALTER TABLE public.shift_bookings DROP CONSTRAINT IF EXISTS shift_bookings_shift_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS shift_bookings_one_active
  ON public.shift_bookings (shift_id) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_shift_bookings_shift_status
  ON public.shift_bookings (shift_id, status);
CREATE INDEX IF NOT EXISTS idx_shift_bookings_user
  ON public.shift_bookings (user_id, created_at DESC);

-- Booking-driven shift state: insert confirms, cancellation reopens.
CREATE OR REPLACE FUNCTION public.sync_shift_status_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE public.shifts
        SET status = 'booked', booked_by = NEW.user_id
        WHERE id = NEW.shift_id AND status = 'open';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE public.shifts
        SET status = 'open', booked_by = NULL
        WHERE id = NEW.shift_id AND status = 'booked' AND booked_by = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE: legacy/admin cleanup only; normal flows never delete.
  IF OLD.status = 'confirmed' THEN
    UPDATE public.shifts
      SET status = 'open', booked_by = NULL
      WHERE id = OLD.shift_id AND status = 'booked' AND booked_by = OLD.user_id;
  END IF;
  RETURN OLD;
END; $function$;

DROP TRIGGER IF EXISTS shift_bookings_sync_status ON public.shift_bookings;
CREATE TRIGGER shift_bookings_sync_status
AFTER INSERT OR UPDATE OR DELETE ON public.shift_bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_shift_status_on_booking();

-- applications_count on shifts = current active (confirmed) bookings, recomputed idempotently.
CREATE OR REPLACE FUNCTION public.bump_shift_bookings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _shift uuid := COALESCE(NEW.shift_id, OLD.shift_id);
BEGIN
  UPDATE public.shifts s
  SET applications_count = (
    SELECT count(*) FROM public.shift_bookings b
    WHERE b.shift_id = _shift AND b.status = 'confirmed'
  )
  WHERE s.id = _shift;
  RETURN COALESCE(NEW, OLD);
END; $function$;

DROP TRIGGER IF EXISTS shift_bookings_count_trg ON public.shift_bookings;
CREATE TRIGGER shift_bookings_count_trg
AFTER INSERT OR UPDATE OR DELETE ON public.shift_bookings
FOR EACH ROW EXECUTE FUNCTION public.bump_shift_bookings();

UPDATE public.shifts s
SET applications_count = (
  SELECT count(*) FROM public.shift_bookings b
  WHERE b.shift_id = s.id AND b.status = 'confirmed'
)
WHERE s.applications_count IS DISTINCT FROM (
  SELECT count(*) FROM public.shift_bookings b
  WHERE b.shift_id = s.id AND b.status = 'confirmed'
);

-- Only notify on a new confirmed booking.
CREATE OR REPLACE FUNCTION public.notify_shift_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _fac_user uuid; _title text;
BEGIN
  IF NEW.status <> 'confirmed' THEN RETURN NEW; END IF;
  SELECT f.user_id, s.title INTO _fac_user, _title
  FROM public.shifts s JOIN public.facilities f ON f.id = s.facility_id WHERE s.id = NEW.shift_id;
  IF _fac_user IS NULL THEN RETURN NEW; END IF;
  PERFORM public.push_notification(_fac_user, 'shift_booking', 'حجز مناوبة جديد', 'New shift booking',
    _title, _title, '/facility');
  RETURN NEW;
END; $function$;

-- Booking a shift tolerates historical cancelled rows.
CREATE OR REPLACE FUNCTION public.book_open_shift(_shift_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _booking_id uuid;
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'professional') THEN
    RAISE EXCEPTION 'PROFESSIONAL_REQUIRED';
  END IF;
  PERFORM 1 FROM public.shifts s
  WHERE s.id = _shift_id AND s.status = 'open' AND s.starts_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;

  BEGIN
    INSERT INTO public.shift_bookings (shift_id, user_id, status)
    VALUES (_shift_id, auth.uid(), 'confirmed')
    RETURNING id INTO _booking_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'SHIFT_UNAVAILABLE';
  END;

  IF _booking_id IS NULL THEN RAISE EXCEPTION 'SHIFT_UNAVAILABLE'; END IF;
  RETURN _booking_id;
END;
$function$;

-- Professional cancellation keeps the record.
DROP FUNCTION IF EXISTS public.cancel_my_shift_booking(uuid);
CREATE OR REPLACE FUNCTION public.cancel_my_shift_booking(_booking_id uuid, _reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _shift_id uuid;
  _status text;
  _fac_user uuid;
  _title text;
  _starts timestamptz;
  _reason_clean text := NULLIF(btrim(COALESCE(_reason, '')), '');
BEGIN
  PERFORM public.require_mfa();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF length(COALESCE(_reason_clean, '')) > 500 THEN RAISE EXCEPTION 'REASON_TOO_LONG'; END IF;

  SELECT b.shift_id, b.status INTO _shift_id, _status
  FROM public.shift_bookings b
  WHERE b.id = _booking_id AND b.user_id = auth.uid()
  FOR UPDATE;

  IF _shift_id IS NULL THEN RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE'; END IF;
  IF _status = 'cancelled' THEN RETURN _shift_id; END IF;

  SELECT s.starts_at, s.title, f.user_id INTO _starts, _title, _fac_user
  FROM public.shifts s
  LEFT JOIN public.facilities f ON f.id = s.facility_id
  WHERE s.id = _shift_id
  FOR UPDATE OF s;

  IF _starts IS NULL OR _starts <= now() THEN RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE'; END IF;

  UPDATE public.shift_bookings
  SET status = 'cancelled',
      cancelled_at = now(),
      cancellation_actor = 'professional',
      cancellation_reason = _reason_clean
  WHERE id = _booking_id;

  UPDATE public.interviews
  SET status = 'cancelled',
      notes = COALESCE(notes, ''),
      candidate_note = 'CANCELLED_BOOKING',
      updated_at = now()
  WHERE shift_booking_id = _booking_id
    AND status IN ('scheduled','confirmed');

  IF _fac_user IS NOT NULL THEN
    PERFORM public.push_notification(
      _fac_user,
      'shift_booking_cancelled',
      'أُلغي حجز مناوبة',
      'A shift booking was cancelled',
      COALESCE(_title, '') || ' — ' || to_char(_starts at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC',
      COALESCE(_title, '') || ' — ' || to_char(_starts at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC',
      '/facility'
    );
  END IF;

  RETURN _shift_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_my_shift_booking(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_shift_booking(uuid, text) TO authenticated, service_role;

-- Facility cancellation keeps the booking record too.
CREATE OR REPLACE FUNCTION public.cancel_facility_shift(_shift_id uuid, _reason text DEFAULT NULL)
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
  _booking uuid;
  _reason_clean text := NULLIF(btrim(COALESCE(_reason, '')), '');
BEGIN
  PERFORM public.require_mfa();
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

  SELECT b.id, b.user_id INTO _booking, _pro
  FROM public.shift_bookings b
  WHERE b.shift_id = _shift_id AND b.status = 'confirmed'
  FOR UPDATE
  LIMIT 1;

  IF _booking IS NOT NULL THEN
    UPDATE public.shift_bookings
    SET status = 'cancelled',
        cancelled_at = now(),
        cancellation_actor = 'facility',
        cancellation_reason = _reason_clean
    WHERE id = _booking;

    UPDATE public.interviews
    SET status = 'cancelled', updated_at = now()
    WHERE shift_booking_id = _booking
      AND status IN ('scheduled','confirmed');
  END IF;

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