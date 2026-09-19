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

## Admin bootstrap (first administrator)

There is no self-service way to become an administrator. Nothing in the frontend,
email address, or signup metadata grants the `admin` role.

The first administrator must be assigned explicitly from a trusted backend/SQL
context (service role), after the project owner picks the account:

```sql
-- run from a trusted service-role context only
select public.bootstrap_admin_role('<auth-user-uuid>');
```

`bootstrap_admin_role` has `EXECUTE` revoked from `anon` and `authenticated`;
only `service_role` can call it.

Once at least one administrator exists, further admins are managed from the
trusted admin flow:

```sql
select public.admin_set_admin_role('<auth-user-uuid>', true);   -- grant
select public.admin_set_admin_role('<auth-user-uuid>', false);  -- revoke
```

`admin_set_admin_role` requires the caller to already be an administrator, refuses
self-removal, and refuses removing the last administrator.

### Release readiness

Signed-in administrators can open **Admin → Release readiness**, which runs
`public.release_readiness_report()`: live admin count, orphaned role/profile rows,
role/profile mismatches, intentional owner-less facility listings, and any
leftover `*@e2e.syndeocare.test` test accounts. A `live_admin_count` of `0` is a
release blocker, not a warning.

### Orphan cleanup

`public.cleanup_orphaned_identities()` (service role only, repeatable) removes
role, notification, and device rows that belong to deleted accounts, hides
orphaned professional profiles from search, and deletes orphaned profiles only
when they carry no business history (applications, bookings, reviews,
conversations, messages, invitations).
