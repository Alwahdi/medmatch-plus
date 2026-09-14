-- 1) Valid shift status transitions only
CREATE OR REPLACE FUNCTION public.enforce_shift_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF OLD.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'SHIFT_FINAL_STATE';
  END IF;
  IF OLD.status = 'open' AND NEW.status IN ('booked', 'cancelled') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'booked' AND NEW.status IN ('open', 'cancelled', 'completed') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'INVALID_SHIFT_TRANSITION';
END;
$$;

DROP TRIGGER IF EXISTS enforce_shift_status_transition ON public.shifts;
CREATE TRIGGER enforce_shift_status_transition
BEFORE UPDATE OF status ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.enforce_shift_status_transition();

-- 2) Facility owner completes a booked shift once it has actually ended
CREATE OR REPLACE FUNCTION public.complete_shift(_shift_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  UPDATE public.shifts s
  SET status = 'completed', updated_at = now()
  WHERE s.id = _shift_id
    AND s.status = 'booked'
    AND s.ends_at <= now()
    AND EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = s.facility_id AND f.user_id = auth.uid())
  RETURNING s.id INTO _id;
  IF _id IS NULL THEN RAISE EXCEPTION 'SHIFT_NOT_COMPLETABLE'; END IF;
  RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_shift(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_shift(uuid) TO authenticated, service_role;

-- 3) No booking cancellation after the shift has started
DROP POLICY IF EXISTS "booking cancel" ON public.shift_bookings;
CREATE POLICY "booking cancel before start" ON public.shift_bookings
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.shifts s WHERE s.id = shift_bookings.shift_id AND s.starts_at > now())
);

CREATE OR REPLACE FUNCTION public.cancel_my_shift_booking(_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _shift_id uuid;
BEGIN
  SELECT b.shift_id INTO _shift_id
  FROM public.shift_bookings b
  JOIN public.shifts s ON s.id = b.shift_id
  WHERE b.id = _booking_id
    AND b.user_id = auth.uid()
    AND s.starts_at > now()
  FOR UPDATE OF b;

  IF _shift_id IS NULL THEN
    RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE';
  END IF;

  DELETE FROM public.shift_bookings
  WHERE id = _booking_id AND user_id = auth.uid();

  UPDATE public.shifts
  SET status = 'open', booked_by = NULL, updated_at = now()
  WHERE id = _shift_id
    AND status = 'booked'
    AND booked_by = auth.uid();

  RETURN _shift_id;
END;
$$;