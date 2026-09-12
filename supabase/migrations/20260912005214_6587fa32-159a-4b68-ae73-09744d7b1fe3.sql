-- ============ conversations ============
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  professional_user_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  subject text,
  identity_revealed boolean NOT NULL DEFAULT true,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, professional_user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_conversations_pro ON public.conversations(professional_user_id, last_message_at DESC);
CREATE INDEX idx_conversations_facility ON public.conversations(facility_id, last_message_at DESC);

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    LEFT JOIN public.facilities f ON f.id = c.facility_id
    WHERE c.id = _conversation_id
      AND (c.professional_user_id = _user_id OR f.user_id = _user_id)
  );
$$;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "participants read conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (professional_user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));

CREATE POLICY "facility starts conversation" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));

CREATE POLICY "participants update conversation" ON public.conversations
  FOR UPDATE TO authenticated
  USING (professional_user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.user_id = auth.uid()));

CREATE POLICY "participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "participants mark read" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.bump_conversation_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_bump_conversation AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_activity();

-- ============ identity reveal on facilities ============
CREATE OR REPLACE FUNCTION public.can_view_facility_identity(_facility_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.facility_id = _facility_id AND c.professional_user_id = _user_id AND c.identity_revealed
  ) OR EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.facility_id = _facility_id AND a.user_id = _user_id
      AND a.status IN ('shortlisted','interview','offer','hired')
  ) OR EXISTS (
    SELECT 1 FROM public.shift_bookings b
    JOIN public.shifts s ON s.id = b.shift_id
    WHERE s.facility_id = _facility_id AND b.user_id = _user_id AND b.status = 'confirmed'
  );
$$;
REVOKE ALL ON FUNCTION public.can_view_facility_identity(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_facility_identity(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "revealed facilities visible to matched pros" ON public.facilities
  FOR SELECT TO authenticated
  USING (public.can_view_facility_identity(id, auth.uid()));

-- ============ job alerts ============
CREATE TABLE public.job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  country text,
  city text,
  employment_type public.employment_type,
  channel text NOT NULL DEFAULT 'email',
  whatsapp_phone text,
  is_active boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_alerts TO authenticated;
GRANT ALL ON public.job_alerts TO service_role;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own job alerts" ON public.job_alerts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER job_alerts_updated_at BEFORE UPDATE ON public.job_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ candidate search (quota enforced) ============
CREATE OR REPLACE FUNCTION public.search_candidates(
  _specialty_id uuid DEFAULT NULL,
  _country text DEFAULT NULL,
  _city text DEFAULT NULL,
  _min_experience integer DEFAULT NULL,
  _limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  headline text,
  specialty_id uuid,
  years_experience integer,
  country text,
  city text,
  bio text,
  is_open_to_shifts boolean,
  is_verified boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _facility uuid;
  _quota integer;
  _used integer;
BEGIN
  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN
    RAISE EXCEPTION 'NOT_A_FACILITY';
  END IF;

  SELECT p.candidate_searches, s.searches_used INTO _quota, _used
  FROM public.facility_subscriptions s
  JOIN public.subscription_plans p ON p.code = s.plan_code
  WHERE s.facility_id = _facility AND s.ends_at > now()
  LIMIT 1;

  IF _quota IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_SUBSCRIPTION';
  END IF;
  IF _quota >= 0 AND _used >= _quota THEN
    RAISE EXCEPTION 'SEARCH_QUOTA_EXCEEDED';
  END IF;

  RETURN QUERY
  SELECT h.id, h.user_id, h.headline, h.specialty_id, h.years_experience,
         h.country, h.city, h.bio, h.is_open_to_shifts, h.is_verified
  FROM public.healthcare_professionals h
  WHERE (_specialty_id IS NULL OR h.specialty_id = _specialty_id)
    AND (_country IS NULL OR h.country = _country)
    AND (_city IS NULL OR h.city ILIKE '%' || _city || '%')
    AND (_min_experience IS NULL OR h.years_experience >= _min_experience)
  ORDER BY h.is_verified DESC, h.years_experience DESC
  LIMIT LEAST(COALESCE(_limit, 20), 50);
END; $$;
REVOKE ALL ON FUNCTION public.search_candidates(uuid, text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_candidates(uuid, text, text, integer, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_candidate_search()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _facility uuid; _left integer;
BEGIN
  SELECT f.id INTO _facility FROM public.facilities f WHERE f.user_id = auth.uid() LIMIT 1;
  IF _facility IS NULL THEN RAISE EXCEPTION 'NOT_A_FACILITY'; END IF;
  UPDATE public.facility_subscriptions s
    SET searches_used = s.searches_used + 1
  WHERE s.facility_id = _facility AND s.ends_at > now();
  SELECT GREATEST(p.candidate_searches - s.searches_used, 0) INTO _left
  FROM public.facility_subscriptions s
  JOIN public.subscription_plans p ON p.code = s.plan_code
  WHERE s.facility_id = _facility AND s.ends_at > now() LIMIT 1;
  RETURN COALESCE(_left, 0);
END; $$;
REVOKE ALL ON FUNCTION public.consume_candidate_search() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_candidate_search() TO authenticated, service_role;