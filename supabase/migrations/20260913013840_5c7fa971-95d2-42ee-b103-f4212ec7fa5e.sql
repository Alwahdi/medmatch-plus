CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  credential_id text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE (user_id, credential_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trusted_devices TO authenticated;
GRANT ALL ON public.trusted_devices TO service_role;

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own trusted devices" ON public.trusted_devices
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.my_sessions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text,
  not_after timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT s.id, s.created_at, s.updated_at, s.user_agent, host(s.ip)::text, s.not_after
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.updated_at DESC NULLS LAST
  LIMIT 50
$$;

REVOKE ALL ON FUNCTION public.my_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_sessions() TO authenticated;