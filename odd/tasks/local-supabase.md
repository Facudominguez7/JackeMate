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
- **S5** "yo quiero que en cualquiera de esos sistemas operativos se pueda correr con un comando y que vaya solicitando al usuario lo que necesita para dejar al dia su base local" (Windows, macOS and Linux).
  - One command, `npm run db:setup`, that works natively on all three: a Node script with no bash, no python, no shell between the arguments.
  - It asks for what is missing: Docker installed and running, then where the data comes from (production copy, saved copy), then the connection string, hidden.
  - It leaves the local base up to date: stack running, repo migrations applied, data loaded, `.env.development.local` written.
  - Assumption: it also offers an empty database with the catalogs only, for someone without production access (`supabase/seed.sql`, no personal data).

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1, S4 | inline | done | CLI 2.121.0, config.toml Auth = prod, scripts; stack starts |
| T2 | S1 | inline | done | local schema dump = prod baseline except pending drop_rol_id and a cosmetic schema comment |
| T3 | S2, S3 | inline | done | row counts = prod (19 users, 34 reports, 43 objects); Chrome 3 sizes; local signup → Mailpit → confirmed + profile |
| T4 | S5 | inline | done | RED → GREEN 22 helper tests, suite 103; Linux runs of every path; Windows/macOS not run |

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
- **L7** RDD review (risk, resilience, readability): approved and acknowledged, with 8 advisories. Fixed in a follow-up commit:
  - The dump excludes live Auth credentials and session state (`-x`: sessions, refresh_tokens, one_time_tokens, flow_state, MFA challenges and AMR claims, audit log, and others), because a copied refresh token still works against production. The saved copy was stripped in place: 12 sessions, 16 refresh tokens, 3 one-time tokens, 49 flow states and 104 audit rows removed.
  - `db:env` fails before writing when the stack is down, so a truncated file can no longer fall back to the production `.env.local`. Verified: exit 1 with the file unchanged, then success after start.
  - The dump is written to `.partial` and moved, so a failed dump keeps the previous copy.
  - The storage MIME type is read from a TSV instead of a per-file SQL query that interpolated the object name.
  - Not changed: the container name duplicates `project_id`; a partial storage sync aborts without restoring owners (re-running fixes it).
- **L8** (2026-10-21) User asked how someone else sets it up on Windows or macOS. Findings: the bash scripts do not run in PowerShell or cmd, `python3` is often a Store stub on Windows, and `date -r` is GNU. User: "si, yo quiero que en cualquiera de esos sistemas operativos se pueda correr con un comando y que vaya solicitando al usuario lo que necesita para dejar al dia su base local se entiende?" → T4: rewrite as one interactive Node script.
- **L9** T4: `npm run db:setup` (`scripts/local-supabase/setup.mjs` plus tested pure helpers in `lib.mjs`) replaces the bash scripts and `db:pull`/`db:reset`/`db:env`.
  - How it stays cross-platform: the Supabase CLI runs through its npm entry with the same Node (the lockfile has the Windows, macOS and Linux binaries), Docker runs without a shell, the SQL file streams into `docker exec psql`, and the storage copy uses `fetch`.
  - It asks for Docker (and waits), then the data source (production / saved copy / empty with catalogs from the new `supabase/seed.sql`), then the hidden connection string. Up to 3 tries, with a dump to `.partial`.
  - Verified on Linux:
    - `--saved`: 43/43 files.
    - `--production` with `SUPABASE_DB_URL` pointed at the local DB as a stand-in source: full path, no `.partial` left.
    - Wrong password: exit 1, saved copy hash unchanged.
    - `DOCKER_HOST` unreachable: Linux install hint, exit 1.
    - `--empty`: 5 roles, 7 categories, 0 users; an API signup created a profile with rol 2 (test user deleted).
    - Interactive menu through a pty: invalid "9" re-asks, "2" loads the saved copy.
    - Hidden prompt: neither the invalid answer nor the URL was echoed.
    - The real copy was restored afterwards.
  - Not verified: Windows and macOS (no machine here).
