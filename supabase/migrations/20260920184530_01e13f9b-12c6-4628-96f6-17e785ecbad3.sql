-- Phase 100 (cont.): remaining admin read branches require admin MFA.

DROP POLICY IF EXISTS "app own read" ON public.applications;
CREATE POLICY "app own read" ON public.applications
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.admin_mfa_access_ok()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.facilities f ON f.id = j.facility_id
      WHERE j.id = applications.job_id AND f.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "booking read" ON public.shift_bookings;
CREATE POLICY "booking read" ON public.shift_bookings
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.admin_mfa_access_ok()
    OR EXISTS (
      SELECT 1 FROM public.shifts s
      JOIN public.facilities f ON f.id = s.facility_id
      WHERE s.id = shift_bookings.shift_id AND f.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pro own read" ON public.healthcare_professionals;
CREATE POLICY "pro own read" ON public.healthcare_professionals
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.admin_mfa_access_ok()
    OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.facilities f ON f.id = j.facility_id
      WHERE a.user_id = healthcare_professionals.user_id AND f.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.shift_bookings b
      JOIN public.shifts s ON s.id = b.shift_id
      JOIN public.facilities f2 ON f2.id = s.facility_id
      WHERE b.user_id = healthcare_professionals.user_id AND f2.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations cv
      JOIN public.facilities f3 ON f3.id = cv.facility_id
      WHERE cv.professional_user_id = healthcare_professionals.user_id AND f3.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pro reviews visible to related parties" ON public.reviews;
CREATE POLICY "pro reviews visible to related parties" ON public.reviews
  FOR SELECT TO authenticated USING (
    direction = 'facility_to_pro'::review_direction
    AND (
      professional_user_id = auth.uid()
      OR author_user_id = auth.uid()
      OR public.admin_mfa_access_ok()
    )
  );

DROP POLICY IF EXISTS "facility reviews visible to related parties" ON public.reviews;
CREATE POLICY "facility reviews visible to related parties" ON public.reviews
  FOR SELECT TO authenticated USING (
    direction = 'pro_to_facility'::review_direction
    AND (
      professional_user_id = auth.uid()
      OR author_user_id = auth.uid()
      OR public.admin_mfa_access_ok()
      OR EXISTS (
        SELECT 1 FROM public.facilities f
        WHERE f.id = reviews.facility_id AND f.user_id = auth.uid()
      )
    )
  );