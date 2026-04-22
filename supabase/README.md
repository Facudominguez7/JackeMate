# Supabase rollout notes

This project is adopting tracked Supabase artifacts incrementally.

- `supabase/migrations/20260421231500_baseline_adoption.sql` is the compatibility-first baseline marker for this change.
- `supabase/migrations/20260422000500_report_image_compatibility_and_rls.sql` adds the first safe compatibility migration: canonical `fotos_reporte.bucket/path`, resumable backfill, evidence-backed image indexes, and limited RLS/storage tightening for `roles`, `estados`, `fotos_reporte`, and the public `reportes` bucket listing policy.
- `supabase/migrations/20260422013500_trusted_mutations_and_incremental_rls.sql` adds the next rollout slice: advisor-backed foreign-key indexes plus read-only RLS for `reportes`, `comentarios_reporte`, and `historial_estados` now that those writes run from trusted server boundaries.
- `supabase/migrations/20260422043000_profiles_public_projection_and_rls.sql` adds the `public.public_profiles` safe projection for shared identity reads and enables owner-only RLS on `public.profiles` so `email` stays in trusted/server-only boundaries.
- `supabase/access-matrix.md` documents the trusted access model used to phase in RLS and storage tightening.
- Future schema and policy changes for this change MUST be added as incremental migrations after the baseline file.

## Current repository constraint

The Supabase CLI is not installed in this workspace, so the remote schema could not be pulled automatically into a generated baseline snapshot during this batch. The baseline file therefore acts as the tracked adoption marker while the access matrix and live DB inspection results capture the rollout source of truth for the affected tables and bucket.
