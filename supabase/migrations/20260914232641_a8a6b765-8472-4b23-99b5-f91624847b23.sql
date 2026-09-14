CREATE POLICY candidate_search_requests_service_only
ON public.candidate_search_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);