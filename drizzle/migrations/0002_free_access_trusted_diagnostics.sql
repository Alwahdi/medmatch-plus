-- Trusted diagnostics can verify the same access rule used by protected RPCs.
-- The private predicate remains unavailable to browser/anonymous roles.
GRANT EXECUTE ON FUNCTION private.subscription_is_live(text, timestamptz) TO service_role;
COMMENT ON FUNCTION private.subscription_is_live(text, timestamptz) IS 'Current free facility access is status-based, not time-based; verification and quotas are enforced separately.';