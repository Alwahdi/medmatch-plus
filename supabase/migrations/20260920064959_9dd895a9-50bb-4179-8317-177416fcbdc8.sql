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
  SET status = 'cancelled', updated_at = now()
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