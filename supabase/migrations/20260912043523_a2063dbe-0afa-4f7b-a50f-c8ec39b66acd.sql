CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','declined','cancelled');

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  professional_user_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE,
  message text,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT invitation_target CHECK (num_nonnulls(job_id, shift_id) = 1)
);

CREATE UNIQUE INDEX idx_invitations_job_unique ON public.invitations(job_id, professional_user_id) WHERE job_id IS NOT NULL;
CREATE UNIQUE INDEX idx_invitations_shift_unique ON public.invitations(shift_id, professional_user_id) WHERE shift_id IS NOT NULL;
CREATE INDEX idx_invitations_pro ON public.invitations(professional_user_id, status);
CREATE INDEX idx_invitations_facility ON public.invitations(facility_id, status);

GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facility manages invitations" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    professional_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())
  );

CREATE POLICY "facility sends invitations" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));

CREATE POLICY "participants update invitations" ON public.invitations
  FOR UPDATE TO authenticated
  USING (
    professional_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid())
  );

-- الدعوة المقبولة تكشف هوية المنشأة وتفتح المحادثة
CREATE OR REPLACE FUNCTION public.on_invitation_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _conv uuid;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  NEW.responded_at := now();
  IF NEW.status = 'accepted' THEN
    SELECT c.id INTO _conv FROM public.conversations c
      WHERE c.facility_id = NEW.facility_id
        AND c.professional_user_id = NEW.professional_user_id
        AND c.job_id IS NOT DISTINCT FROM NEW.job_id
        AND c.shift_id IS NOT DISTINCT FROM NEW.shift_id
      LIMIT 1;
    IF _conv IS NULL THEN
      INSERT INTO public.conversations (facility_id, professional_user_id, job_id, shift_id, subject, identity_revealed)
      VALUES (NEW.facility_id, NEW.professional_user_id, NEW.job_id, NEW.shift_id, 'قبول دعوة', true);
    ELSE
      UPDATE public.conversations SET identity_revealed = true WHERE id = _conv;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER invitations_response BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.on_invitation_response();