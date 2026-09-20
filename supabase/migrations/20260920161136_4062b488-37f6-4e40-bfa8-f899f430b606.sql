-- Phase 83 fix: row locking requires a VOLATILE function.
CREATE OR REPLACE FUNCTION private.invitation_target_available(
  _facility_id uuid,
  _job_id uuid,
  _shift_id uuid,
  _lock boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  _ok boolean;
BEGIN
  IF _job_id IS NULL AND _shift_id IS NULL THEN
    RETURN true;
  END IF;

  IF _job_id IS NOT NULL THEN
    IF _lock THEN
      PERFORM 1 FROM public.jobs j WHERE j.id = _job_id FOR UPDATE;
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = _job_id
        AND j.facility_id = _facility_id
        AND j.is_active
        AND (j.expires_at IS NULL OR j.expires_at > now())
    ) INTO _ok;
    RETURN _ok;
  END IF;

  IF _lock THEN
    PERFORM 1 FROM public.shifts s WHERE s.id = _shift_id FOR UPDATE;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = _shift_id
      AND s.facility_id = _facility_id
      AND s.status = 'open'::public.shift_status
      AND s.starts_at > now()
  ) INTO _ok;
  RETURN _ok;
END;
$$;

REVOKE ALL ON FUNCTION private.invitation_target_available(uuid, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.invitation_target_available(uuid, uuid, uuid, boolean) TO service_role;