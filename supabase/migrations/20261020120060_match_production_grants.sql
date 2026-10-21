-- Restores production's privileges on top of the schema baseline.
--
-- `20261020120050_remote_schema.sql` is a pg_dump of production. pg_dump writes each object's
-- final GRANTs, but not the REVOKEs production ran after Supabase's default privileges had already
-- given `anon` and `authenticated` ALL on new tables and EXECUTE on new functions (see
-- `supabase/archive/migrations/20261019180000_revoke_public_write_grants.sql` and
-- `20261019120000_anonymous_guest_identities.sql`). Replayed on a fresh database, the baseline
-- would leave those roles with write access to every public table, including the auto-updatable
-- `public_profiles` view. Production already matches this state, so this is a no-op there.

-- Tables and views: production keeps SELECT and MAINTAIN only.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public
  from anon, authenticated;

-- The rate-limit ledger holds hashed client IPs: production gives clients no access at all.
revoke all on table public.report_submission_attempts from anon, authenticated;

-- The policy-backed client inserts production keeps.
grant insert on table public.fotos_reporte, public.votos_no_existe, public.votos_reparado to authenticated;

-- Server-only functions: production lets only the service role run them.
revoke all on function public.adjust_profile_points_atomic(uuid, integer, text) from anon, authenticated;
revoke all on function public.claim_report_submission(uuid, uuid, text, integer, integer, integer, integer) from anon, authenticated;
revoke all on function public.estado_confirmacion_email(text) from anon, authenticated;
