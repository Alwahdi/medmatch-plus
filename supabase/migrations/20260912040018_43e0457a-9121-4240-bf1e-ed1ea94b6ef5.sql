DROP POLICY IF EXISTS "pro own read" ON public.healthcare_professionals;
CREATE POLICY "pro own read" ON public.healthcare_professionals
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN facilities f ON f.id = j.facility_id
    WHERE a.user_id = healthcare_professionals.user_id AND f.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM shift_bookings b
    JOIN shifts s ON s.id = b.shift_id
    JOIN facilities f2 ON f2.id = s.facility_id
    WHERE b.user_id = healthcare_professionals.user_id AND f2.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM conversations cv
    JOIN facilities f3 ON f3.id = cv.facility_id
    WHERE cv.professional_user_id = healthcare_professionals.user_id AND f3.user_id = auth.uid()
  )
);

DROP FUNCTION IF EXISTS public.has_conversation_with_pro(uuid, uuid);