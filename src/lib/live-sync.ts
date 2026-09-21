import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLiveFallbackPolling } from "@/lib/live-fallback";
import type { User } from "@supabase/supabase-js";

/**
 * التحديث التلقائي: قناة بث حي واحدة تربط كل جدول بمفاتيح الاستعلامات
 * التي يجب إبطالها عند تغيّره، فلا يحتاج المستخدم إلى تحديث الصفحة.
 * البث يخضع لسياسات RLS: لا يصل المستخدم إلا ما يحق له قراءته.
 */
const TABLE_KEYS: Record<string, string[]> = {
  applications: [
    "facility-applicants",
    "facility-dashboard",
    "facility-jobs",
    "my-apps",
    "my-apps-full",
    "my-applied-job-ids",
    "application",
    "applicant-report",
    "pending-reviews",
    "pending-interviews",
    "job",
    "jobs",
  ],
  jobs: [
    "facility-jobs",
    "facility-dashboard",
    "home-jobs",
    "jobs",
    "job",
    "search-jobs",
    "recommended-jobs",
    "saved-jobs",
    "public-facility-jobs",
    "alert-matches",
  ],
  shifts: [
    "facility-shifts",
    "facility-dashboard",
    "home-shifts",
    "shifts",
    "shift",
    "search-shifts",
    "public-facility-shifts",
    "my-shifts",
  ],
  shift_bookings: [
    "facility-shift-bookings",
    "facility-shifts",
    "facility-dashboard",
    "my-shifts",
    "my-booked-shift-ids",
    "shift-booking",
    "pending-reviews",
    "pending-interviews",
  ],
  invitations: [
    "invitations-sent",
    "my-invitations",
    "pending-invitations",
    "invite-target",
    "facility-dashboard",
  ],
  interviews: ["interview", "pending-interviews", "facility-applicants", "my-apps", "my-apps-full"],
  credentials: ["my-creds", "admin-creds", "admin-user-overview", "my-pro-verified", "onboarding-state"],
  facility_documents: [
    "facility-docs",
    "admin-facility-docs",
    "admin-user-overview",
    "my-facility-verify",
  ],
  reviews: ["review", "facility-reviews", "pending-reviews", "candidate-profile", "public-facility"],
  conversations: ["conversations", "revealed-facility"],
  profile_change_requests: ["my-change-requests", "admin-change-requests", "admin-user-overview"],
  safety_reports: ["admin-safety-reports"],
  contact_messages: ["admin-inbox"],
  account_deletion_requests: ["account-deletion-request", "admin-deletion-requests"],
  facilities: [
    "my-facility",
    "my-facility-lite",
    "my-facility-verify",
    "public-facility",
    "admin-facilities",
    "admin-user-overview",
    "facility-dashboard",
  ],
  healthcare_professionals: [
    "my-pro",
    "my-pro-verified",
    "my-pro-specialty",
    "candidate-profile",
    "admin-pros",
    "admin-user-overview",
    "onboarding-state",
  ],
  facility_subscriptions: ["facility-sub", "search-quota"],
  platform_settings: ["platform-settings"],
  document_requirements: ["doc-requirements", "doc-requirements-all"],
};

export function useLiveSync(user: User | null | undefined) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }

    // تجميع الأحداث المتتابعة في إبطال واحد حتى لا تتكرر الطلبات.
    let pending = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      timer = undefined;
      const keys = Array.from(pending);
      pending = new Set();
      invalidate(queryClient, keys);
    };
    const schedule = (keys: string[]) => {
      for (const k of keys) pending.add(k);
      if (timer) return;
      timer = setTimeout(flush, 400);
    };

    const channel = supabase.channel(`live-sync-${user.id}-${Math.random().toString(36).slice(2)}`);
    for (const [table, keys] of Object.entries(TABLE_KEYS)) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => schedule(keys));
    }
    channel.subscribe((status) => {
      setConnected(status === "SUBSCRIBED");
    });

    return () => {
      if (timer) clearTimeout(timer);
      setConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useLiveFallbackPolling(!!user && !connected);
}

function invalidate(queryClient: QueryClient, keys: string[]) {
  for (const key of keys) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
}
