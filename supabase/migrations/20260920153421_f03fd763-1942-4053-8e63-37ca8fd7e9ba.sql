-- Phase 76: candidate search visibility becomes explicit opt-in.

ALTER TABLE public.healthcare_professionals
  ALTER COLUMN is_searchable SET DEFAULT false;

ALTER TABLE public.healthcare_professionals
  ADD COLUMN IF NOT EXISTS search_visibility_confirmed_at timestamptz;

-- Prior rows were searchable because of the old default and an on-by-default
-- form, not because anyone opted in. Consent is not inferred from that state.
UPDATE public.healthcare_professionals
SET is_searchable = false,
    search_visibility_confirmed_at = NULL
WHERE search_visibility_confirmed_at IS NULL
  AND is_searchable;

ALTER TABLE public.healthcare_professionals
  DROP CONSTRAINT IF EXISTS hp_searchable_requires_consent;
ALTER TABLE public.healthcare_professionals
  ADD CONSTRAINT hp_searchable_requires_consent
  CHECK (is_searchable = false OR search_visibility_confirmed_at IS NOT NULL);

-- Visibility is no longer writable through a generic profile save.
REVOKE INSERT (is_searchable), UPDATE (is_searchable)
  ON public.healthcare_professionals FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_search_visibility(_visible boolean)
RETURNS timestamptz
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _confirmed timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  PERFORM public.require_mfa();
  IF _visible IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

  UPDATE public.healthcare_professionals h
  SET is_searchable = _visible,
      -- Turning it on records a fresh consent; turning it off keeps the
      -- previous consent as an audit trail but hides the profile.
      search_visibility_confirmed_at = CASE
        WHEN _visible THEN now()
        ELSE h.search_visibility_confirmed_at
      END,
      updated_at = now()
  WHERE h.user_id = auth.uid()
  RETURNING h.search_visibility_confirmed_at INTO _confirmed;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_PROFESSIONAL_PROFILE';
  END IF;

  RETURN CASE WHEN _visible THEN _confirmed ELSE NULL END;
END;
$$;

REVOKE ALL ON FUNCTION public.set_search_visibility(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_search_visibility(boolean) TO authenticated, service_role;

-- Unused legacy search that ignored the visibility preference and exposed
-- headline/bio. The live path is search_candidates_idempotent.
DROP FUNCTION IF EXISTS public.search_candidates(uuid, text, text, integer, integer);

REVOKE ALL ON public.healthcare_professionals FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN ON public.healthcare_professionals FROM anon, authenticated;
GRANT SELECT ON public.healthcare_professionals TO anon, authenticated;
GRANT ALL ON public.healthcare_professionals TO service_role;
ALTER TABLE public.healthcare_professionals ENABLE ROW LEVEL SECURITY;