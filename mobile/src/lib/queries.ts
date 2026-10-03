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
      const res = await supabase.rpc("respond_to_invitation" as never, { _invitation_id: id, _accept: accept } as never);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-invitations"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export type ConversationRow = {
  id: string;
  subject: string | null;
  last_message_at: string;
  identity_revealed: boolean;
  facility_id: string;
  professional_user_id: string;
  job_id: string | null;
  shift_id: string | null;
};

export type ConversationParty = {
  name: string;
  sub: string;
  verified: boolean;
  image: string | null;
  kind: "facility" | "pro";
  linkId: string | null;
  hidden: boolean;
};

export type ConversationsData = {
  list: ConversationRow[];
  facilities: Record<string, { id: string; name_ar: string; name_en: string | null; city: string; country: string; is_verified: boolean; logo_url: string | null }>;
  pros: Record<string, { user_id: string; full_name: string; headline: string | null; is_verified: boolean; avatar_url: string | null }>;
  jobs: Record<string, { id: string; title: string }>;
  shifts: Record<string, { id: string; title: string }>;
};

async function fetchConversationsData(): Promise<ConversationsData> {
  const list = unwrap(
    await supabase
      .from("conversations")
      .select("id,subject,last_message_at,identity_revealed,facility_id,professional_user_id,job_id,shift_id")
      .order("last_message_at", { ascending: false }),
  ) as ConversationRow[];
  const empty: ConversationsData = { list, facilities: {}, pros: {}, jobs: {}, shifts: {} };
  if (list.length === 0) return empty;

  const [facilitiesRes, prosRes, jobsRes, shiftsRes] = await Promise.all([
    supabase
      .from("facilities")
      .select("id,name_ar,name_en,city,country,is_verified,logo_url")
      .in("id", Array.from(new Set(list.map((c) => c.facility_id)))),
    supabase
      .from("healthcare_professionals")
      .select("user_id,full_name,headline,is_verified,avatar_url")
      .in("user_id", Array.from(new Set(list.map((c) => c.professional_user_id)))),
    supabase.from("jobs").select("id,title").in("id", list.map((c) => c.job_id).filter(Boolean) as string[]),
    supabase.from("shifts").select("id,title").in("id", list.map((c) => c.shift_id).filter(Boolean) as string[]),
  ]);
  for (const row of unwrap(facilitiesRes)) empty.facilities[row.id] = row;
  for (const row of unwrap(prosRes)) empty.pros[row.user_id] = row;
  for (const row of unwrap(jobsRes)) empty.jobs[row.id] = row;
  for (const row of unwrap(shiftsRes)) empty.shifts[row.id] = row;
  return empty;
}

/** يحدد الطرف الآخر في المحادثة مع احترام إخفاء هوية المنشأة قبل الكشف. */
export function conversationParty(
  conv: ConversationRow,
  data: ConversationsData,
  myUserId: string | undefined,
  lang: "ar" | "en",
): ConversationParty {
  const isPro = conv.professional_user_id === myUserId;
  if (isPro) {
    const f = data.facilities[conv.facility_id];
    const revealed = conv.identity_revealed && Boolean(f);
    return {
      name: revealed ? (lang === "ar" ? f!.name_ar : f!.name_en || f!.name_ar) : lang === "ar" ? "منشأة صحية" : "Healthcare facility",
      sub: revealed && f ? [f.city, f.country].filter(Boolean).join("، ") : lang === "ar" ? "الهوية مخفية حتى بدء التواصل" : "Identity hidden until contact",
      verified: revealed ? f!.is_verified : false,
      image: revealed ? f!.logo_url : null,
      kind: "facility",
      linkId: revealed ? conv.facility_id : null,
      hidden: !revealed,
    };
  }
  const p = data.pros[conv.professional_user_id];
  return {
    name: p?.full_name ?? (lang === "ar" ? "مختص صحي" : "Healthcare professional"),
    sub: p?.headline ?? "",
    verified: p?.is_verified ?? false,
    image: p?.avatar_url ?? null,
    kind: "pro",
    linkId: p ? conv.professional_user_id : null,
    hidden: false,
  };
}

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: fetchConversationsData,
  });
}

export function useConversation(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation", id, user?.id],
    enabled: Boolean(user?.id) && Boolean(id),
    queryFn: async () => {
      const data = await fetchConversationsData();
      const conv = data.list.find((c) => c.id === id) ?? null;
      return { ...data, conv };
    },
  });
}

export function useUnreadMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-messages", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return [];
      return unwrap(
        await supabase
          .from("messages")
          .select("id,conversation_id")
          .neq("sender_id", user.id)
          .is("read_at", null),
      );
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: Boolean(conversationId),
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
      void qc.invalidateQueries({ queryKey: ["unread-messages"] });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await supabase.rpc("mark_conversation_read", { _conversation_id: conversationId });
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

export type DocumentRequirement = {
  id: string; target: string; code: string; name_ar: string; name_en: string;
  is_required: boolean; min_count: number; requires_expiry: boolean;
  requires_issue_date: boolean; requires_issuer: boolean; note_ar: string | null;
  note_en: string | null; sort_order: number;
};

export type VerificationDocument = {
  id: string; doc_type: string; title: string; issuer: string | null;
  issue_date: string | null; expiry_date: string | null; file_name: string | null;
  file_path: string | null; status: "pending" | "approved" | "rejected";
  review_note: string | null; created_at: string;
};

export function useDocumentRequirements(target: "professional" | "facility") {
  return useQuery({
    queryKey: ["document-requirements", target],
    staleTime: 1000 * 60 * 15,
    queryFn: async () => unwrap(await supabase.from("document_requirements")
      .select("id,target,code,name_ar,name_en,is_required,min_count,requires_expiry,requires_issue_date,requires_issuer,note_ar,note_en,sort_order")
      .eq("target", target).eq("is_active", true).order("sort_order")) as DocumentRequirement[],
  });
}

export function useVerificationDocuments(target: "professional" | "facility", facilityId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["verification-documents", target, user?.id, facilityId],
    enabled: target === "professional" ? Boolean(user?.id) : Boolean(facilityId),
    queryFn: async () => {
      const base = target === "professional"
        ? supabase.from("credentials").select("id,doc_type,title,issuer,issue_date,expiry_date,file_name,file_path,status,review_note,created_at").eq("user_id", user?.id ?? "")
        : supabase.from("facility_documents").select("id,doc_type,title,issuer,issue_date,expiry_date,file_name,file_path,status,review_note,created_at").eq("facility_id", facilityId ?? "");
      return unwrap(await base.order("created_at", { ascending: false })) as VerificationDocument[];
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => unwrap(await supabase.from("locations")
      .select("id,country,city_ar,city_en,region_ar,region_en,sort_order")
      .eq("is_active", true).order("sort_order")),
  });
}

export function useDistricts(country: string, city: string) {
  const locations = useLocations();
  const matching = (locations.data ?? []).filter((row) => row.city_ar === city && (row.country === country || (country === "YE" && ["YE", "اليمن", "Yemen"].includes(row.country)) || (row.country === "YE" && ["اليمن", "Yemen"].includes(country))));
  return useQuery({
    queryKey: ["districts", matching.map((r) => r.id).join(",")],
    enabled: !!city && !locations.isPending && !locations.isError && matching.length > 0,
    queryFn: async () => unwrap(await supabase.from("districts").select("id,name_ar,name_en,city_location_id").eq("is_active", true).in("city_location_id", matching.map((row) => row.id)).order("sort_order")),
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

export function useFacilityShift(shiftId: string, facilityId?: string) {
  return useQuery({
    queryKey: ["facility-shift", facilityId, shiftId],
    enabled: Boolean(facilityId && shiftId),
    queryFn: async () => {
      const res = await supabase.from("shifts")
        .select("id,title,status,starts_at,ends_at,city,hourly_rate,currency,applications_count,notes")
        .eq("facility_id", facilityId ?? "").eq("id", shiftId).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useJobApplicants(jobId: string) {
  return useQuery({
    queryKey: ["job-applicants", jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      const applications = unwrap(await supabase.from("applications")
        .select("id,status,created_at,cover_letter,user_id")
        .eq("job_id", jobId).order("created_at", { ascending: false }));
      const ids = applications.map((item) => item.user_id);
      if (ids.length === 0) return [];
      const profiles = unwrap(await supabase.from("healthcare_professionals")
        .select("user_id,full_name,headline,city,years_experience,is_verified,rating_avg,rating_count,specialties(name_ar,name_en)")
        .in("user_id", ids));
      const byUser = new Map(profiles.map((profile) => [profile.user_id, profile]));
      return applications.map((application) => ({ ...application, professional: byUser.get(application.user_id) ?? null }));
    },
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

export function useMyInterviews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-interviews", user?.id], enabled: Boolean(user?.id),
    queryFn: async () => unwrap(await supabase.from("interviews")
      .select("id,application_id,shift_booking_id,job_id,shift_id,scheduled_at,duration_minutes,mode,location,meeting_url,notes,status,candidate_note,jobs(title),shifts(title)")
      .eq("professional_user_id", user?.id ?? "").order("scheduled_at", { ascending: true })),
  });
}

export function useRespondInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const res = await supabase.rpc("respond_to_interview", { _interview_id: id, _accept: accept });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["my-interviews"] }); void qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

export function useScheduleInterview(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, scheduledAt, mode, location, meetingUrl, notes }: { applicationId: string; scheduledAt: string; mode: "video" | "phone" | "onsite"; location?: string; meetingUrl?: string; notes?: string }) => {
      const res = await supabase.rpc("schedule_interview", { _application_id: applicationId, _shift_booking_id: null as never, _scheduled_at: scheduledAt, _duration_minutes: 30, _mode: mode, _location: location || undefined, _meeting_url: meetingUrl || undefined, _notes: notes || undefined });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["job-applicants", jobId] }); void qc.invalidateQueries({ queryKey: ["facility-interviews"] }); },
  });
}

export function useHireApplicant(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const res = await supabase.rpc("hire_applicant", { _application_id: applicationId });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["job-applicants", jobId] }); void qc.invalidateQueries({ queryKey: ["facility-jobs"] }); },
  });
}

export function useSuggestedCandidates(jobId: string) {
  return useQuery({
    queryKey: ["suggested-candidates", jobId],
    enabled: Boolean(jobId),
    queryFn: async () => unwrap(await supabase.rpc("suggest_candidates", { _job_id: jobId, _limit: 20, _offset: 0 })),
  });
}

export function useInviteSuggestedCandidate(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (candidateId: string) => {
      const res = await supabase.rpc("send_candidate_invitation_from_search", { _candidate_id: candidateId, _job_id: jobId });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suggested-candidates", jobId] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export type CreateJobInput = {
  facilityId: string; title: string; description: string; specialtyId: string | null;
  employmentType: "full_time" | "part_time" | "contract" | "locum" | "shift";
  country: string; city: string; districtId?: string | null; salaryMin: number; salaryMax: number;
  minExperience: number; vacancies: number; requiredLicense: string | null;
};

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const res = await supabase.from("jobs").insert({
        facility_id: input.facilityId, title: input.title, description: input.description,
        specialty_id: input.specialtyId, employment_type: input.employmentType,
        country: input.country, city: input.city, district_id: input.districtId ?? null, salary_min: input.salaryMin,
        salary_max: input.salaryMax, currency: "YER", min_experience: input.minExperience,
        vacancies: input.vacancies, required_license: input.requiredLicense,
      }).select("id").single();
      if (res.error) throw new Error(res.error.message);
      return res.data.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["facility-jobs"] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export type CreateShiftInput = {
  facilityId: string; title: string; specialtyId: string | null; startsAt: string;
  endsAt: string; hourlyRate: number; country: string; city: string; districtId?: string | null; notes: string | null;
};

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      const res = await supabase.from("shifts").insert({
        facility_id: input.facilityId, title: input.title, specialty_id: input.specialtyId,
        starts_at: input.startsAt, ends_at: input.endsAt, hourly_rate: input.hourlyRate,
        currency: "YER", country: input.country, city: input.city, district_id: input.districtId ?? null, notes: input.notes,
      }).select("id").single();
      if (res.error) throw new Error(res.error.message);
      return res.data.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["facility-shifts"] });
      void qc.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

/** Admin-controlled platform switch (defaults to off when unset). */
export function usePlatformFlag(key: "allow_cross_city_listings" | "professional_own_city_feed") {
  return useQuery({
    queryKey: ["platform-setting", key],
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("enabled").eq("key", key).maybeSingle();
      return Boolean(data?.enabled);
    },
  });
}
