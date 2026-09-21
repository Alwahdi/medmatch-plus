import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type JobRow = {
  id: string;
  title: string;
  city: string;
  country: string;
  currency: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  min_experience: number | null;
  applications_count: number | null;
  facility_id: string;
  facility_verified: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  description?: string | null;
  specialty_name_ar?: string | null;
  specialty_name_en?: string | null;
  vacancies?: number | null;
};

export type ShiftRow = {
  id: string;
  title: string;
  city: string;
  country: string;
  currency: string;
  hourly_rate: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
  is_urgent: boolean | null;
  notes: string | null;
  facility_id: string;
  facility_verified: boolean | null;
  specialty_name_ar?: string | null;
  specialty_name_en?: string | null;
};

const unwrap = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
};

export function useSpecialties() {
  return useQuery({
    queryKey: ["specialties"],
    staleTime: 1000 * 60 * 30,
    queryFn: async () =>
      unwrap(await supabase.from("specialties").select("id,name_ar,name_en,category,slug").order("name_ar")),
  });
}

export function useJobSearch(params: { q?: string; specialtyId?: string | null; city?: string | null }) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: async () =>
      unwrap(
        await supabase.rpc("search_public_jobs", {
          _q: params.q || undefined,
          _specialty_id: params.specialtyId || undefined,
          _city: params.city || undefined,
          _limit: 40,
          _offset: 0,
        }),
      ) as unknown as JobRow[],
  });
}

export function useShiftSearch(params: { q?: string; specialtyId?: string | null; city?: string | null }) {
  return useQuery({
    queryKey: ["shifts", params],
    queryFn: async () =>
      unwrap(
        await supabase.rpc("search_public_shifts", {
          _q: params.q || undefined,
          _specialty_id: params.specialtyId || undefined,
          _city: params.city || undefined,
          _limit: 40,
          _offset: 0,
        }),
      ) as unknown as ShiftRow[],
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await supabase.from("public_jobs").select("*").eq("id", id).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return res.data as unknown as JobRow | null;
    },
  });
}

export function useShift(id: string) {
  return useQuery({
    queryKey: ["shift", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await supabase.from("public_shifts").select("*").eq("id", id).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return res.data as unknown as ShiftRow | null;
    },
  });
}

export function useMyApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("applications")
          .select("id,status,created_at,cover_letter,job_id,jobs(id,title,city,country,is_active)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useMyBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("shift_bookings")
          .select("id,status,created_at,shift_id,shifts(id,title,city,country,starts_at,ends_at,hourly_rate,currency)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useMyInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-invitations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("invitations")
          .select("id,status,message,created_at,job_id,shift_id,jobs(title),shifts(title)")
          .eq("professional_user_id", user!.id)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useRespondInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const res = await supabase
        .from("invitations")
        .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
        .eq("id", id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-invitations"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("conversations")
          .select("id,subject,last_message_at,identity_revealed,facility_id,professional_user_id,job_id,shift_id")
          .order("last_message_at", { ascending: false }),
      ),
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: Boolean(conversationId),
    refetchInterval: 15000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("messages")
          .select("id,body,sender_id,created_at,attachment_name,attachment_path,read_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
      ),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, body, sender_id: user!.id });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    refetchInterval: 45000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("notifications")
          .select("id,title_ar,title_en,body_ar,body_en,link,type,read_at,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function usePendingReviews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pending-reviews", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => unwrap(await supabase.rpc("my_pending_reviews")),
  });
}

export function useProfessionalProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["professional-profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await supabase
        .from("healthcare_professionals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useMyFacility() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-facility", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await supabase.from("facilities").select("*").eq("user_id", user!.id).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useFacilityJobs(facilityId: string | undefined) {
  return useQuery({
    queryKey: ["facility-jobs", facilityId],
    enabled: Boolean(facilityId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("jobs")
          .select("id,title,city,country,is_active,vacancies,applications_count,created_at,expires_at")
          .eq("facility_id", facilityId!)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useFacilityShifts(facilityId: string | undefined) {
  return useQuery({
    queryKey: ["facility-shifts", facilityId],
    enabled: Boolean(facilityId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("shifts")
          .select("id,title,city,status,starts_at,ends_at,hourly_rate,currency,applications_count")
          .eq("facility_id", facilityId!)
          .order("starts_at", { ascending: false }),
      ),
  });
}

export function useJobApplicants(jobId: string) {
  return useQuery({
    queryKey: ["job-applicants", jobId],
    enabled: Boolean(jobId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("applications")
          .select("id,status,created_at,cover_letter,user_id")
          .eq("job_id", jobId)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useSetApplicationStage(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await supabase.rpc("set_application_stage", {
        _application_id: id,
        _status: status as never,
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["job-applicants", jobId] }),
  });
}
