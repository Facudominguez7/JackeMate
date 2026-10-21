# Local Supabase in Docker

Objective: develop against a local Supabase stack in Docker that matches production instead of the production database.
Branch: `chore/local-supabase` · Delivery: ask-on-risk (single PR expected; generated schema dump excluded from the line forecast) · Test runner: Vitest (`npx vitest run`) plus manual stack checks.

## Specs

- **S1** "quiero que configures con docker una base de datos identica a la de supabase ya que ahora se esta programando usando la base de datos de produccion."
  - The local stack runs with the Supabase CLI (`supabase start`): Postgres 17, Auth, Storage, PostgREST, Studio and a local mailbox.
  - The schema matches production: tables, functions, triggers, RLS policies, grants, extensions and the `reportes` bucket. The source is a `supabase db dump` of production, stored as the baseline migration.
  - The local Auth settings follow the production ones documented in `supabase/README.md`: anonymous sign-ins, manual linking, secure password change and the Spanish email templates in `supabase/templates/`.
- **S2** Data: the user chose "Copia de producción". Local data is a copy of production: all rows, including `auth.users`, plus the files in the `reportes` bucket. The copy is never committed; it lives in gitignored files and can be refreshed with one command.
- **S3** The app in development (`npm run dev`) uses the local stack, not production. Assumption: production keys stay where they are; the local values override them only in development.
- **S4** Documentation: how to start, stop and reset the stack, refresh the production copy, and write new migrations.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1, S4 | inline | done | CLI 2.121.0, config.toml Auth = prod, scripts; stack starts |
| T2 | S1 | inline | done | local schema dump = prod baseline except pending drop_rol_id and a cosmetic schema comment |
| T3 | S2, S3 | inline | done | row counts = prod (19 users, 34 reports, 43 objects); Chrome 3 sizes; local signup → Mailpit → confirmed + profile |

- T1: Supabase CLI as a dev dependency, `supabase/config.toml` aligned with production Auth, npm scripts, gitignore for local copies.
- T2: production schema baseline (`supabase db dump`, run by the user with the database URL), the old migrations archived, and the pending `public_profiles_drop_rol_id` migration kept after the baseline.
- T3: data and storage copy scripts, load into the local stack, development env pointing to it, docs.

Route evidence: no Writer trigger reason (sequential units, context below the backstop), so every task is inline. T2 waits on the user for the production database URL (remote read, explicitly authorized per run).

## Log

- **L1** (2026-10-21) User: "quiero que configures con docker una base de datos identica a la de supabase ya que ahora se esta programando usando la base de datos de produccion."
- **L2** (2026-10-21) User chose "Copia de producción" for the local data (other options were catalogs plus demo data, or catalogs only).
- **L3** Findings:
  - `20260421231500_baseline_adoption.sql` is a no-op, so the repo migrations cannot rebuild the schema.
  - Production's migration history uses other versions, has two migrations missing from the repo (`add_rechazado_estado`, `auth_users_profiles_sync_trigger`), and lacks `public_profiles_drop_rol_id` (phase 2, pending).
  - Production holds 19 users, 34 reports, 43 storage objects (1.9 MB, public bucket `reportes`); the database is 13 MB.
  - Extensions: pgcrypto, uuid-ossp, pg_stat_statements, supabase_vault.
- **L4** (2026-10-21) The user ran `npm run db:pull -- --schema` (baseline written) and `npm run db:pull`. The seed step failed: "COPY from stdin failed: No source stream defined", because the CLI seeder cannot read the COPY blocks of `--use-copy` dumps. Fix: the seeder is off, and the script loads the copy with psql inside the db container as `supabase_admin`. The dump starts with `SET session_replication_role = replica`. New `npm run db:reset` (`--load`) reloads the saved copy without the production URL. Two script bugs fixed: `docker exec -i` inside the loop consumed the file list (1 of 43 files copied), and a `RETURN` trap ran on an out-of-scope variable.
- **L5** Schema diff (local `supabase db dump --local` vs the baseline):
  - pg_dump keeps the final GRANTs but not production's REVOKEs. On top of Supabase's default privileges, anon and authenticated got ALL on every public table and EXECUTE on 3 server-only functions.
    - `20261020120060_match_production_grants.sql` restores the production ACL: SELECT/MAINTAIN on tables, INSERT on fotos_reporte and the two vote tables, nothing on report_submission_attempts, and the 3 functions revoked.
  - The dump also skips the auth and storage schemas.
    - `20261020120070_auth_and_storage_objects.sql` adds the `on_auth_user_profile_sync` trigger and the two `reportes` upload policies, copied from production.
  - No Realtime publications exist in production.
  - Remaining diff: `public_profiles` (pending phase 2) and a cosmetic `COMMENT ON SCHEMA public`.
- **L6** Verification (headed Chrome, system channel):
  - `/reportes` at 1920×1080, 1280×720 and 390×844: 10/10 thumbnails load from `127.0.0.1:54321`, no production references, no horizontal scroll.
  - Signup on localhost: the Spanish confirmation email lands in Mailpit, its link goes to `/mapa` signed in, and the user is confirmed with a profile created by the trigger. The test user was deleted afterwards.
  - Vitest 81 passing, tsc clean.
  - Observation, not in scope: the trigger only stores id/email/rol_id, so `username` is empty. Same in production (7 of 10 registered users).
