CREATE POLICY "Facility owners upload facility docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'facility-docs'
  AND EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.user_id = auth.uid() AND f.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Facility owners read facility docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'facility-docs'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.user_id = auth.uid() AND f.id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Facility owners delete facility docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'facility-docs'
  AND EXISTS (
    SELECT 1 FROM public.facilities f
    WHERE f.user_id = auth.uid() AND f.id::text = (storage.foldername(name))[1]
  )
);