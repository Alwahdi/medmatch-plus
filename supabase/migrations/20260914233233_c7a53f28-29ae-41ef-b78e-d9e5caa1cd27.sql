CREATE OR REPLACE FUNCTION public.save_engagement_review(
  _direction public.review_direction,
  _facility_id uuid,
  _professional_user_id uuid,
  _rating integer,
  _comment text DEFAULT NULL,
  _job_id uuid DEFAULT NULL,
  _shift_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _review_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF _rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'INVALID_RATING'; END IF;
  IF length(COALESCE(_comment, '')) > 800 THEN RAISE EXCEPTION 'COMMENT_TOO_LONG'; END IF;
  IF NOT public.has_engagement(_facility_id, _professional_user_id) THEN RAISE EXCEPTION 'ENGAGEMENT_REQUIRED'; END IF;
  IF _direction = 'pro_to_facility' THEN
    IF auth.uid() <> _professional_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  ELSIF _direction = 'facility_to_pro' THEN
    IF NOT EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = _facility_id AND f.user_id = auth.uid()) THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_DIRECTION';
  END IF;
  IF _job_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE a.job_id = _job_id AND a.user_id = _professional_user_id
      AND j.facility_id = _facility_id AND a.status = 'hired'
  ) THEN RAISE EXCEPTION 'INVALID_JOB_ENGAGEMENT'; END IF;
  IF _shift_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shift_bookings b JOIN public.shifts s ON s.id = b.shift_id
    WHERE b.shift_id = _shift_id AND b.user_id = _professional_user_id
      AND s.facility_id = _facility_id AND b.status = 'confirmed'
  ) THEN RAISE EXCEPTION 'INVALID_SHIFT_ENGAGEMENT'; END IF;
  INSERT INTO public.reviews (
    direction, facility_id, professional_user_id, author_user_id,
    rating, comment, job_id, shift_id
  ) VALUES (
    _direction, _facility_id, _professional_user_id, auth.uid(),
    _rating, NULLIF(btrim(_comment), ''), _job_id, _shift_id
  )
  ON CONFLICT (direction, facility_id, professional_user_id)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    job_id = EXCLUDED.job_id,
    shift_id = EXCLUDED.shift_id,
    updated_at = now()
  WHERE public.reviews.author_user_id = auth.uid()
  RETURNING id INTO _review_id;
  IF _review_id IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  RETURN _review_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_engagement_review(public.review_direction, uuid, uuid, integer, text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_engagement_review(public.review_direction, uuid, uuid, integer, text, uuid, uuid) TO authenticated, service_role;
REVOKE INSERT, UPDATE ON public.reviews FROM authenticated;