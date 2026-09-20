-- Hotfix: a previous migration revoked all privileges from authenticated on these
-- tables without re-granting, breaking every signed-in read. Restore least privilege.
GRANT SELECT ON public.facilities TO authenticated;
GRANT INSERT (user_id, name_ar, name_en, facility_type, country, city, description, logo_url, website),
      UPDATE (user_id, name_ar, name_en, facility_type, country, city, description, logo_url, website)
  ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;

GRANT SELECT ON public.healthcare_professionals TO authenticated;
GRANT INSERT (user_id, full_name, headline, specialty_id, years_experience, country, city, bio,
              license_country, license_number, is_open_to_shifts, expected_salary, currency,
              avatar_url, is_searchable),
      UPDATE (user_id, full_name, headline, specialty_id, years_experience, country, city, bio,
              license_country, license_number, is_open_to_shifts, expected_salary, currency,
              avatar_url, is_searchable)
  ON public.healthcare_professionals TO authenticated;
GRANT ALL ON public.healthcare_professionals TO service_role;