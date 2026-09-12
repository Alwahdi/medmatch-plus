CREATE OR REPLACE FUNCTION public.sync_shift_status_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shifts
      SET status = 'booked', booked_by = NEW.user_id
      WHERE id = NEW.shift_id AND status = 'open';
    RETURN NEW;
  END IF;
  UPDATE public.shifts
    SET status = 'open', booked_by = NULL
    WHERE id = OLD.shift_id AND status = 'booked';
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS shift_bookings_sync_status ON public.shift_bookings;
CREATE TRIGGER shift_bookings_sync_status
AFTER INSERT OR DELETE ON public.shift_bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_shift_status_on_booking();

UPDATE public.shifts s
SET status = 'booked', booked_by = b.user_id
FROM public.shift_bookings b
WHERE b.shift_id = s.id AND s.status = 'open';