-- Phase 50: add the MFA guard to business SECURITY DEFINER RPCs.
-- Targeted, verified rewrite over an explicit allowlist: the guard is inserted
-- right after the function's first top-level BEGIN; bodies are otherwise
-- untouched and functions that already carry the guard are skipped.
DO $do$
DECLARE
  _names text[] := ARRAY[
    'admin_data_integrity_report','admin_review_credential','admin_review_facility_document',
    'admin_set_admin_role','admin_set_facility_verified','admin_set_professional_verified',
    'book_open_shift','cancel_facility_shift','cancel_interview','cancel_my_shift_booking',
    'claim_facility_role','claim_professional_role','cleanup_orphaned_identities',
    'complete_interview','complete_shift','consume_ai_quota','consume_candidate_search',
    'hire_applicant','release_readiness_report','reschedule_interview','respond_to_interview',
    'review_change_request','save_engagement_review','schedule_interview','search_candidates',
    'search_candidates_atomic','search_candidates_idempotent','send_candidate_invitation',
    'set_application_stage','start_candidate_conversation','submit_job_application','unhire_applicant'
  ];
  _rec record;
  _def text;
  _lines text[];
  _out text[];
  _i int;
  _done boolean;
  _patched int := 0;
BEGIN
  FOR _rec IN
    SELECT p.oid, p.proname, l.lanname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype <> 'trigger'::regtype
      AND p.proname = ANY(_names)
  LOOP
    IF _rec.lanname <> 'plpgsql' THEN
      RAISE EXCEPTION 'MFA guard: % is not plpgsql', _rec.proname;
    END IF;
    IF position('require_mfa' in pg_get_functiondef(_rec.oid)) > 0 THEN
      CONTINUE; -- idempotent
    END IF;

    _def := pg_get_functiondef(_rec.oid);
    _lines := string_to_array(_def, E'\n');
    _out := ARRAY[]::text[];
    _done := false;
    FOR _i IN 1 .. array_length(_lines, 1) LOOP
      _out := _out || _lines[_i]::text;
      IF NOT _done AND btrim(_lines[_i]) = 'BEGIN' THEN
        _out := _out || '  PERFORM public.require_mfa();'::text;
        _done := true;
      END IF;
    END LOOP;

    IF NOT _done THEN
      RAISE EXCEPTION 'MFA guard: no top-level BEGIN found in %', _rec.proname;
    END IF;

    EXECUTE array_to_string(_out, E'\n');
    _patched := _patched + 1;
  END LOOP;

  RAISE NOTICE 'MFA guard applied to % function(s)', _patched;
END
$do$;

-- my_sessions is SQL-language and already filters on public.mfa_access_ok().
DO $verify$
DECLARE _missing text;
BEGIN
  SELECT string_agg(p.proname, ', ')
  INTO _missing
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = ANY (ARRAY[
      'book_open_shift','submit_job_application','start_candidate_conversation',
      'send_candidate_invitation','save_engagement_review','schedule_interview',
      'hire_applicant','search_candidates_idempotent','consume_ai_quota',
      'admin_set_admin_role','review_change_request','cancel_facility_shift'
    ])
    AND position('require_mfa' in p.prosrc) = 0;
  IF _missing IS NOT NULL THEN
    RAISE EXCEPTION 'MFA guard missing on: %', _missing;
  END IF;
END
$verify$;