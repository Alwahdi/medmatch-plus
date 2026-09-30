<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Mobile legal consent records are inserted per document version; do not upsert on `(user_id, doc_key)` because the database uniqueness key also includes `version`.

- Mobile country and city selection reads active administrator-managed locations and persists the Arabic city key across languages, because search and listings compare the stored city string.

- Mobile visual and interaction primitives live in `mobile/src/components/` and use `mobile/src/lib/theme.ts`, so Arabic and English screens share one coherent system instead of divergent one-off styles.

- Web Google authentication uses Google Identity Services directly on externally hosted custom domains, because Lovable's OAuth broker exists only on Lovable-hosted origins; Lovable preview and production origins keep the managed broker.
- Established account locations are locked by database triggers and changed through admin-reviewed requests; mobile profile saves exclude location after creation to avoid accidental bypass or errors.
- Established professional specialties are locked by database trigger and changed through the same admin-reviewed requests; mobile saves omit established specialty values to preserve review authority.
- Mobile selectors use the shared searchable ChoiceField and notification links are mapped to existing Expo routes; this keeps RTL/LTR selections consistent and prevents web-only notification paths from opening missing pages.
- Mobile account deletion requests reuse the protected web RPC and remain review-only until a trusted deletion finalizer exists; this avoids falsely marking accounts erased.
- Mobile sign-in challenges enrolled TOTP factors natively and resumes only a known internal destination; protected deletion requests must not weaken the database MFA gate.
- iOS exposes email/password authentication without Google until compliant Apple sign-in is configured; third-party-only login would block store review.
