ALTER TABLE public.candidate_search_access ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.candidate_search_access FROM anon, authenticated;
GRANT ALL ON public.candidate_search_access TO service_role;

DROP POLICY IF EXISTS "candidate_search_access service role only" ON public.candidate_search_access;
CREATE POLICY "candidate_search_access service role only"
  ON public.candidate_search_access
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);