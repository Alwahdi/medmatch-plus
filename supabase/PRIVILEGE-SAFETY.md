# Privilege safety convention (Phase 60)

**Default database privileges cannot be changed through the current connector**
(`ALTER DEFAULT PRIVILEGES` fails with `42501 permission denied to change default
privileges`). Supabase's `pg_default_acl` entries for `postgres`/`supabase_admin`
therefore keep granting broad table privileges (`arwdDxtm`, including `MAINTAIN`,
`TRUNCATE`, `TRIGGER`, `REFERENCES`) and function `EXECUTE` to `anon` and
`authenticated` on every newly created public object.

**Consequence: explicit least-privilege GRANT/REVOKE is mandatory in every migration.**
Never rely on Supabase/Postgres default grants.

## Required tail block for every new public table

```sql
CREATE TABLE public.<t> (...);

REVOKE ALL ON public.<t> FROM anon, authenticated;              -- start from zero
GRANT SELECT ON public.<t> TO authenticated;                    -- only what the client needs
-- GRANT INSERT, UPDATE, DELETE ...  only when the client writes directly (not via RPC)
-- GRANT SELECT ON public.<t> TO anon;  only for genuinely public data
GRANT ALL ON public.<t> TO service_role;

ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ;
```

`TRUNCATE`, `TRIGGER`, `REFERENCES` and `MAINTAIN` must never be held by `anon`
or `authenticated`.

## Functions

```sql
CREATE OR REPLACE FUNCTION public.<f>(...) ... SECURITY DEFINER SET search_path TO 'public' ...;
REVOKE ALL ON FUNCTION public.<f>(...) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.<f>(...) TO authenticated, service_role;
```

Only `public.submit_contact_message` is intentionally executable by `anon`.
Admin-only reports must call `public.require_mfa()` and check
`public.has_role(auth.uid(), 'admin')` inside the body.

## Sequences

No client grants unless a client genuinely needs `nextval`. Default:

```sql
REVOKE ALL ON SEQUENCE public.<s> FROM anon, authenticated;
```

## Verification

Run `select * from public.release_privilege_audit();` as an MFA-verified admin.
Any row with severity `blocker` must be fixed before release. It reports:
non-client privileges held by client roles, anonymous write privileges,
direct writes on server-managed (RPC-only) tables, unexpected
PUBLIC/anon-executable SECURITY DEFINER functions, client-reachable tables
without RLS, and client sequence privileges.
