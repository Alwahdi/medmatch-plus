DROP POLICY IF EXISTS "pro own read" ON public.healthcare_professionals;
CREATE POLICY "pro own read" ON public.healthcare_professionals
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
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
);

DROP POLICY IF EXISTS "self assign non admin role" ON public.user_roles;
CREATE POLICY "self assign professional role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'professional'::public.app_role);