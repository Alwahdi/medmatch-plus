DROP POLICY IF EXISTS "public read facility reviews" ON public.reviews;
DROP POLICY IF EXISTS "facility reviews visible to related parties" ON public.reviews;

CREATE POLICY "facility reviews visible to related parties"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  direction = 'pro_to_facility'::review_direction
  AND (
    professional_user_id = auth.uid()
    OR author_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id = reviews.facility_id AND f.user_id = auth.uid()
    )
  )
);