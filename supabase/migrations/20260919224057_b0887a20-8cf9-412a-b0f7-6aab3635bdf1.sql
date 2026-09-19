GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_read_job_row(uuid, uuid, boolean, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_read_shift_row(uuid, uuid, public.shift_status, timestamptz) TO authenticated;
REVOKE USAGE ON SCHEMA private FROM anon;
REVOKE EXECUTE ON FUNCTION private.can_read_job_row(uuid, uuid, boolean, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION private.can_read_shift_row(uuid, uuid, public.shift_status, timestamptz) FROM anon;