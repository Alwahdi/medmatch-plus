CREATE OR REPLACE FUNCTION public.has_conversation_with_pro(_professional_user_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    JOIN public.facilities f ON f.id = c.facility_id
    WHERE c.professional_user_id = _professional_user_id
      AND f.user_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.has_conversation_with_pro(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_conversation_with_pro(uuid, uuid) TO authenticated;

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
  OR public.has_conversation_with_pro(healthcare_professionals.user_id, auth.uid())
);