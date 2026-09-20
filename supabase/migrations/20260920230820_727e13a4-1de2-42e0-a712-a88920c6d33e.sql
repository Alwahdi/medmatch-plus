ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS pushed_at timestamptz;

CREATE INDEX IF NOT EXISTS notifications_pending_push_idx
  ON public.notifications (created_at)
  WHERE pushed_at IS NULL;

-- Column is system-managed: only the dispatcher (service_role) may set it.
REVOKE UPDATE (pushed_at) ON public.notifications FROM authenticated;