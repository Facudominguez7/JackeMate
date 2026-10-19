# Supabase rollout notes

This project is adopting tracked Supabase artifacts incrementally.

- `supabase/migrations/20260421231500_baseline_adoption.sql` is the compatibility-first baseline marker for this change.
- `supabase/migrations/20260422000500_report_image_compatibility_and_rls.sql` adds the first safe compatibility migration: canonical `fotos_reporte.bucket/path`, resumable backfill, evidence-backed image indexes, and limited RLS/storage tightening for `roles`, `estados`, `fotos_reporte`, and the public `reportes` bucket listing policy.
- `supabase/migrations/20260422013500_trusted_mutations_and_incremental_rls.sql` adds the next rollout slice: advisor-backed foreign-key indexes plus read-only RLS for `reportes`, `comentarios_reporte`, and `historial_estados` now that those writes run from trusted server boundaries.
- `supabase/migrations/20260422043000_profiles_public_projection_and_rls.sql` adds the `public.public_profiles` safe projection for shared identity reads and enables owner-only RLS on `public.profiles` so `email` stays in trusted/server-only boundaries.
- `supabase/migrations/20260422124500_public_profiles_security_invoker.sql` redefines `public.public_profiles` with `security_invoker = true` so the view no longer bypasses caller RLS in Postgres 17.
- `supabase/migrations/20260422125500_reportes_vote_summary_consistency.sql` backfills missing aggregate rows, removes stale rows for hidden reports, and syncs `reportes_vote_summary` from both vote changes and `reportes.deleted_at` visibility changes.
- `supabase/migrations/20261019120000_anonymous_guest_identities.sql` adds anonymous guest support: `invitado` role (5), guest-aware profile trigger with promotion on conversion, guest-safe points RPC, restrictive RLS against anonymous votes/uploads, bucket size/MIME limits, and the `report_submission_attempts` rate-limit ledger with `claim_report_submission()`.
- `supabase/access-matrix.md` documents the trusted access model used to phase in RLS and storage tightening.
- Future schema and policy changes for this change MUST be added as incremental migrations after the baseline file.

## Current repository constraint

The Supabase CLI is not installed in this workspace, so the remote schema could not be pulled automatically into a generated baseline snapshot during this batch. The baseline file therefore acts as the tracked adoption marker while the access matrix and live DB inspection results capture the rollout source of truth for the affected tables and bucket.

## Anonymous sign-ins: dashboard and environment

Settings that cannot be changed through SQL/MCP and must be reviewed in the Supabase Dashboard:

1. **Authentication → Sign In / Providers → Anonymous sign-ins**: must be enabled (verified enabled on 2026-10-19 via `GET /auth/v1/settings`).
2. **Authentication → Sign In / Providers → Allow manual linking**: enable it so guests can link an email (`updateUser({ email })`) or OAuth identity.
3. **Authentication → Attack Protection → CAPTCHA**: enable Cloudflare Turnstile and paste the Turnstile **secret key**. Then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the app. Enable both together: with CAPTCHA on and no site key, guest sign-ins fail.
4. **Authentication → Rate Limits → Anonymous sign-ins**: default 30/hour per IP; adjust if needed.
5. **Authentication → URL Configuration → Redirect URLs**: must include `<site>/auth/callback` (the email-linking confirmation and the password recovery link land there).
6. **Authentication → Emails → Change email address / Reset password** templates: the default `{{ .ConfirmationURL }}` works with `/auth/callback`; custom `token_hash` templates work with `/auth/confirm`.
7. **Authentication → Sign In / Providers → Email → Secure password change**: if enabled, a converted guest whose session is older than 24 h must sign in again before creating the password (the form reports it).

Environment variables (no secrets in the repo):

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Public Turnstile site key. When unset, the widget is hidden and no `captchaToken` is sent. |
| `REPORT_RATE_LIMIT_SALT` | Recommended | Server-only salt used to hash client IPs for report rate limiting. |

Anonymous users are never cleaned up automatically. If needed, an operator can delete stale guests manually (this keeps their reports, setting `reportes.usuario_id` to null):
`delete from auth.users where is_anonymous is true and created_at < now() - interval '90 days';`
