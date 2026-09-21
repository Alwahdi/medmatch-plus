CREATE OR REPLACE FUNCTION public.my_pending_reviews()
RETURNS TABLE (
  direction review_direction,
  facility_id uuid,
  professional_user_id uuid,
  counterpart_name text,
  job_id uuid,
  shift_id uuid,
  context_title text,
  happened_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  engagements AS (
    -- توظيف مؤكد عبر طلب وظيفة
    SELECT j.facility_id, a.user_id AS pro, a.job_id, NULL::uuid AS shift_id, j.title AS ctx, a.updated_at AS at
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.status = 'hired'
    UNION ALL
    -- مناوبة منجزة بحجز مؤكد
    SELECT s.facility_id, b.user_id AS pro, NULL::uuid, s.id, s.title, s.updated_at
    FROM public.shift_bookings b
    JOIN public.shifts s ON s.id = b.shift_id
    WHERE b.status = 'confirmed' AND s.status = 'completed'
  ),
  scoped AS (
    SELECT DISTINCT ON (e.facility_id, e.pro, dir.direction)
      dir.direction, e.facility_id, e.pro, e.job_id, e.shift_id, e.ctx, e.at
    FROM engagements e
    JOIN public.facilities f ON f.id = e.facility_id
    CROSS JOIN me
    CROSS JOIN LATERAL (
      SELECT CASE WHEN f.user_id = me.uid THEN 'facility_to_pro'::review_direction
                  WHEN e.pro = me.uid THEN 'pro_to_facility'::review_direction END AS direction
    ) dir
    WHERE me.uid IS NOT NULL AND dir.direction IS NOT NULL
    ORDER BY e.facility_id, e.pro, dir.direction, e.at DESC
  )
  SELECT s.direction,
         s.facility_id,
         s.pro,
         CASE WHEN s.direction = 'facility_to_pro'
              THEN COALESCE(hp.full_name, p.full_name, '')
              ELSE COALESCE(f.name_ar, f.name_en, '') END,
         s.job_id,
         s.shift_id,
         s.ctx,
         s.at
  FROM scoped s
  JOIN public.facilities f ON f.id = s.facility_id
  LEFT JOIN public.healthcare_professionals hp ON hp.user_id = s.pro
  LEFT JOIN public.profiles p ON p.id = s.pro
  WHERE NOT EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.direction = s.direction
      AND r.facility_id = s.facility_id
      AND r.professional_user_id = s.pro
  )
  ORDER BY s.at DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.my_pending_reviews() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_pending_reviews() TO authenticated;