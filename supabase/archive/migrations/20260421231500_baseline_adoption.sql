-- Baseline adoption marker for `project-hygiene-supabase-boundaries`.
--
-- This file intentionally performs no schema changes in this batch.
-- It establishes a tracked `supabase/migrations/*` baseline before
-- future compatibility-safe schema, RLS, and storage migrations land.
--
-- Live database evidence for the affected rollout surface was captured on
-- 2026-04-21 via Supabase queries and documented in `supabase/access-matrix.md`.
--
-- Why this is a no-op baseline:
-- 1. The repository previously had no tracked Supabase migrations.
-- 2. The Supabase CLI is not installed in this workspace, so an automated
--    remote schema pull could not be generated during this batch.
-- 3. The next migrations for this change must be incremental and compatible,
--    using this file as the tracked adoption anchor.

begin;

-- no-op baseline marker

commit;
