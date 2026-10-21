# Supabase rollout notes

This project is adopting tracked Supabase artifacts incrementally.

- The migration files listed below now live in `archive/migrations/`: the schema baseline replaced them (see "Local development").
- `supabase/migrations/20260421231500_baseline_adoption.sql` is the compatibility-first baseline marker for this change.
- `supabase/migrations/20260422000500_report_image_compatibility_and_rls.sql` adds the first safe compatibility migration: canonical `fotos_reporte.bucket/path`, resumable backfill, evidence-backed image indexes, and limited RLS/storage tightening for `roles`, `estados`, `fotos_reporte`, and the public `reportes` bucket listing policy.
- `supabase/migrations/20260422013500_trusted_mutations_and_incremental_rls.sql` adds the next rollout slice: advisor-backed foreign-key indexes plus read-only RLS for `reportes`, `comentarios_reporte`, and `historial_estados` now that those writes run from trusted server boundaries.
- `supabase/migrations/20260422043000_profiles_public_projection_and_rls.sql` adds the `public.public_profiles` safe projection for shared identity reads and enables owner-only RLS on `public.profiles` so `email` stays in trusted/server-only boundaries.
- `supabase/migrations/20260422124500_public_profiles_security_invoker.sql` redefines `public.public_profiles` with `security_invoker = true` so the view no longer bypasses caller RLS in Postgres 17.
- `supabase/migrations/20260422125500_reportes_vote_summary_consistency.sql` backfills missing aggregate rows, removes stale rows for hidden reports, and syncs `reportes_vote_summary` from both vote changes and `reportes.deleted_at` visibility changes.
- `supabase/migrations/20261019120000_anonymous_guest_identities.sql` adds anonymous guest support: `invitado` role (5), guest-aware profile trigger with promotion on conversion, guest-safe points RPC, restrictive RLS against anonymous votes/uploads, bucket size/MIME limits, and the `report_submission_attempts` rate-limit ledger with `claim_report_submission()`.
- `supabase/migrations/20261019180000_revoke_public_write_grants.sql` revokes the default INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER grants from `anon` and `authenticated` on every table and view in `public`. It closes the auto-updatable `public_profiles` view, which runs as its owner and let the anon key change `rol_id` or `puntos`. Only the policy-backed `authenticated` INSERT grants on `fotos_reporte`, `votos_no_existe` and `votos_reparado` are restored. New tables and views still get Supabase's default grants, so their migrations must revoke write privileges explicitly.
- `supabase/migrations/20261020120000_public_profiles_es_invitado.sql` and `20261020120100_public_profiles_drop_rol_id.sql` replace `rol_id` in `public_profiles` with the boolean `es_invitado`, so anonymous readers can no longer enumerate admin or staff accounts. Apply phase 1 before the app deploy and phase 2 only after it: older builds select `rol_id` from the view.
- `supabase/access-matrix.md` documents the trusted access model used to phase in RLS and storage tightening.
- Future schema and policy changes for this change MUST be added as incremental migrations after the baseline file.

## Local development

Development runs against a local Supabase stack in Docker, not production. It needs Docker and the Supabase CLI, which is a dev dependency (`npx supabase`).

First time, or to refresh the copy of production:

```bash
npm run db:pull   # asks for the production connection string, copies the data and the bucket files
npm run db:env    # writes .env.development.local so `npm run dev` uses the local stack
npm run dev
```

The connection string is in Supabase Dashboard → Connect → Direct → Session pooler. The script reads it from `SUPABASE_DB_URL` or asks for it, and never saves it.

| Command | What it does |
|---------|--------------|
| `npm run db:start` / `npm run db:stop` | Starts or stops the stack. Stopping keeps the data. |
| `npm run db:pull` | Dumps production data into `supabase/.local/prod-data.sql`, resets the local database with it and copies the files of the `reportes` bucket. |
| `npm run db:reset` | Resets the local database with the copy already saved, without connecting to the production database. |
| `npm run db:env` | Writes `.env.development.local` from `supabase status`. Delete that file to develop against production again. |

Local services:
- API: `http://127.0.0.1:54321`.
- Studio: `http://127.0.0.1:54323`.
- Mailpit: `http://127.0.0.1:54324`. Every Auth email lands there, with the templates from `supabase/templates/`.

The production copy holds real user data:
- `supabase/.local/` is gitignored; never commit or share it.
- Users keep their production passwords, so you can sign in locally with your own account.
- `.env.development.local` leaves `RESEND_API_KEY` empty, so report notifications are skipped instead of emailing real users.

`supabase/config.toml` mirrors the production Auth settings listed below. Google sign-in and CAPTCHA are off locally.

### Migrations

- `20261020120050_remote_schema.sql` is a `supabase db dump` of production taken on 2026-10-21 (`npm run db:pull -- --schema` regenerates it).
- `20261020120060_match_production_grants.sql` and `20261020120070_auth_and_storage_objects.sql` restore what the dump leaves out: the revoked client privileges, plus the trigger and the policies production keeps in the `auth` and `storage` schemas.
- These three files describe what production already has: never apply them there.
- The migrations they replace are kept in `archive/migrations/` for their history.
- `20261020120100_public_profiles_drop_rol_id.sql` is still pending in production.
- New schema changes go in new migrations after these files:
  - Test them locally with `npm run db:reset`.
  - Apply them to production as before; production's migration history does not match these file names.

## Anonymous sign-ins: dashboard and environment

Settings that cannot be changed through SQL/MCP and must be reviewed in the Supabase Dashboard:

1. **Authentication → Sign In / Providers → Anonymous sign-ins**: must be enabled (verified enabled on 2026-10-19 via `GET /auth/v1/settings`).
2. **Authentication → Sign In / Providers → Allow manual linking**: enable it so guests can link an email (`updateUser({ email })`) or OAuth identity.
3. **Authentication → Attack Protection → CAPTCHA**: enable Cloudflare Turnstile and paste the Turnstile **secret key**. Then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the app. Enable both together: with CAPTCHA on and no site key, guest sign-ins fail.
4. **Authentication → Rate Limits → Anonymous sign-ins**: default 30/hour per IP; adjust if needed.
5. **Authentication → URL Configuration → Redirect URLs**: must include `<site>/auth/callback` (the email-linking confirmation and the password recovery link land there).
6. **Authentication → Emails → Change email address / Reset password** templates: the default `{{ .ConfirmationURL }}` works with `/auth/callback`; custom `token_hash` templates work with `/auth/confirm`.
7. **Authentication → Sign In / Providers → Email → Secure password change**: **must be enabled** (enabled on 2026-10-19). It is the only enforcement point for password changes: the session cookies are readable by JavaScript (`@supabase/ssr` uses `httpOnly: false`), so anyone holding a session can call `PUT /auth/v1/user` directly and skip any check in our server actions. With it, a session older than 24 h gets `reauthentication_needed` (the form tells the user to request a recovery link, whose fresh session can set the password). Verified on 2026-10-19: a recent session changed the password, and a session aged to 25 h was refused both through `/auth/nueva-contrasena` and through a direct Auth API call. Sessions younger than 24 h can still change the password without the current one; requiring the current password would break recovery.

Environment variables (no secrets in the repo):

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Public Turnstile site key. When unset, the widget is hidden and no `captchaToken` is sent. |
| `REPORT_RATE_LIMIT_SALT` | Recommended | Server-only salt used to hash client IPs for report rate limiting. |

Anonymous users are never cleaned up automatically. If needed, an operator can delete stale guests manually (this keeps their reports, setting `reportes.usuario_id` to null):
`delete from auth.users where is_anonymous is true and created_at < now() - interval '90 days';`
