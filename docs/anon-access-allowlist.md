# Anonymous database access — allowlist policy (Phase 97)

## Principle

Anonymous (signed-out) database access is **allowlisted**, not merely "write-free".
RLS remains the row-level guard, but grants are the first gate: a private table must
not be reachable by `anon` at all, even when no anon policy exists.

## Allowlist — tables and views

`anon` may hold **SELECT only** on exactly these objects:

| Object | Kind | Why |
| --- | --- | --- |
| `public.public_jobs` | view | sanitized public job listings (no facility identity, no publisher, no contact) |
| `public.public_shifts` | view | sanitized public shift listings |
| `public.specialties` | table | reference data used by public filters |

Any other `anon` privilege on a public table or view is a **release blocker**.

## Allowlist — functions

`anon` may hold `EXECUTE` on exactly these documented public read endpoints:

- `public.search_public_jobs`
- `public.search_public_shifts`
- `public.public_listing_places`

Expected count of **SECURITY DEFINER** functions executable by `PUBLIC`/`anon`: **0**.
Internal helpers, guards, normalizers and trigger functions are granted to
`authenticated`/`service_role` only; trigger execution does not require an anon grant.

## Release audit checks (`public.release_privilege_audit`)

| check_code | severity | expected |
| --- | --- | --- |
| `anon_table_allowlist` | blocker | 0 |
| `anon_allowlist_read_only` | blocker | 0 |
| `anon_function_allowlist` | blocker | 0 |
| `public_security_definer_functions` | blocker | 0 |
| `anon_write_privileges` | blocker | 0 |
| `client_non_client_privileges` | blocker | 0 |
| `client_tables_without_rls` | blocker | 0 |
| `client_sequence_privileges` | warning | 0 |

## Adding a future public resource

If a future public page (blog, guides, landing statistics) needs database data:

1. Create a **sanitized view or SECURITY INVOKER RPC** that exposes only the fields
   the public page renders — never restore `anon` on a base table.
2. Confirm it leaks no identity: facility identity, publisher, contact details,
   auth user ids and professional profile ids stay hidden pre-contact.
3. Add the object to the allowlist table above **and** to the `NOT IN (...)` list in
   `release_privilege_audit`, in the same migration, with the reason recorded here.

An undocumented exception is treated as a regression, not a configuration choice.

## Signed-out surfaces that must keep working

- home, `/jobs`, `/shifts`, job/shift detail, specialty pages — served by the three
  allowlisted objects and the three public RPCs.
- contact form — posts through a server function using the service-role internal RPC;
  it never reads `contact_messages` as `anon`.
- auth / register / reset — use Supabase Auth only; no anon read of `profiles` or
  `user_roles`.
- facility identity stays hidden signed-out.
