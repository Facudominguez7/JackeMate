-- Revoke the write privileges that Supabase default ACLs grant to `anon` and
-- `authenticated` on every object in `public`.
--
-- Why:
-- - `public.public_profiles` is a single-table view over `public.profiles`, so
--   Postgres treats it as auto-updatable. It must keep `security_invoker = false`
--   for public identity reads (see 20260422170000), which means writes through it
--   run as the view owner and bypass `profiles` RLS. With the default grants, any
--   caller holding the anon key could PATCH `public_profiles` and change `rol_id`
--   or `puntos` for any user.
-- - Tables were only protected by the absence of write policies. Revoking the
--   grants makes the database deny writes even if a permissive policy is added
--   by mistake later.
--
-- App writes run through the service role (`createAdminClient`), which keeps its
-- own grants. The only policy-backed client writes that exist today are the
-- `authenticated` INSERT policies on `fotos_reporte`, `votos_no_existe` and
-- `votos_reparado`, so their INSERT grant is restored below to keep behavior
-- unchanged. SELECT grants are not touched.
--
-- New objects still receive Supabase's default grants, so future migrations that
-- create tables or views in `public` must revoke write privileges explicitly.

begin;

-- `all tables` covers both tables and views in the schema.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public
  from anon, authenticated;

grant insert on public.fotos_reporte to authenticated;
grant insert on public.votos_no_existe to authenticated;
grant insert on public.votos_reparado to authenticated;

commit;
