# SyndeoCare

منصة توظيف طبي عربية أولاً (RTL) تربط الكوادر الصحية بالمستشفيات والعيادات: وظائف دائمة، مناوبات، توثيق تراخيص، مراسلة، ومراجعات.

Arabic-first healthcare hiring platform: permanent jobs, shifts, credential verification, messaging, and reviews.

## Stack

- TanStack Start v1 (React 19, SSR) + TanStack Router / Query
- Vite 7, TypeScript, Tailwind CSS v4 (`src/styles.css`), shadcn-style UI
- Supabase (Postgres + RLS, Auth, Storage) through Lovable Cloud
- Server logic: `createServerFn` (`src/lib/*.functions.ts`); public HTTP endpoints under `src/routes/api/public/*`

## Local development

```sh
bun install
bun run dev        # http://localhost:8080
bunx tsgo --noEmit # typecheck
bun run build
```

## Environment variables

Names only — never commit values.

Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

Server: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`

## Architecture

```text
src/routes/_public/*         public pages (SSR): home, jobs, shifts, facilities, specialties, auth
src/routes/_authenticated/*  signed-in area (client-gated): dashboard, profile, facility, admin
src/routes/api/public/*      webhooks / cron endpoints (caller verified in the handler)
src/components/              shared UI, panels, shared states (error/empty/skeleton)
src/lib/                     i18n, auth, formatting, storage rules, server functions
supabase/migrations/         tracked schema, RLS policies, grants, RPCs
```

Key rules enforced in the database, not the UI: system-managed fields (verification badges, counters, document review status) are not writable by account owners; sensitive actions run through `SECURITY DEFINER` RPCs with role checks; professional identity stays hidden until an engagement exists.

## Storage bucket configuration

Allowed MIME types and size limits for the `avatars`, `credentials`,
`facility-docs` and `chat-attachments` buckets are enforced twice: by the
`is_allowed_upload()` check used in the `storage.objects` policies (tracked in
migrations) and by the buckets themselves.

Bucket rows cannot be written from SQL migrations (the migration runner rejects
writes to `storage.buckets`), so bucket-level settings are applied with a
repeatable script:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun scripts/setup-storage-buckets.mjs
```

The script is idempotent and holds no secrets; keep both values in the
environment only.
