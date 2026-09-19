CREATE OR REPLACE FUNCTION public.guard_listing_history_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'jobs' THEN
    IF EXISTS (SELECT 1 FROM public.applications a WHERE a.job_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.job_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.job_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.interviews iv WHERE iv.job_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.reviews r WHERE r.job_id = OLD.id) THEN
      RAISE EXCEPTION 'JOB_HAS_HISTORY';
    END IF;
  ELSIF TG_TABLE_NAME = 'shifts' THEN
    IF EXISTS (SELECT 1 FROM public.shift_bookings b WHERE b.shift_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.invitations i WHERE i.shift_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.shift_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.interviews iv WHERE iv.shift_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.reviews r WHERE r.shift_id = OLD.id) THEN
      RAISE EXCEPTION 'SHIFT_HAS_HISTORY';
    END IF;
  END IF;

  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_listing_history_delete() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_listing_history_delete() TO service_role;

DROP TRIGGER IF EXISTS trg_guard_job_history_delete ON public.jobs;
CREATE TRIGGER trg_guard_job_history_delete
BEFORE DELETE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_history_delete();

DROP TRIGGER IF EXISTS trg_guard_shift_history_delete ON public.shifts;
CREATE TRIGGER trg_guard_shift_history_delete
BEFORE DELETE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_history_delete();