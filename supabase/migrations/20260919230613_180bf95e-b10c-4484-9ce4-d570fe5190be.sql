-- Phase 43 data migration (idempotent): strip headline/bio PII from cached candidate_search_requests results
UPDATE public.candidate_search_requests
SET result = (
  SELECT jsonb_agg(
    elem - 'headline' - 'bio'
    || jsonb_build_object('headline', to_jsonb(NULL::text), 'bio', to_jsonb(NULL::text))
  )
  FROM jsonb_array_elements(result) AS elem
)
WHERE jsonb_typeof(result) = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(result) AS e
    WHERE (e->>'headline') IS NOT NULL OR (e->>'bio') IS NOT NULL
  );