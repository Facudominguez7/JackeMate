-- Phase 1 of removing `rol_id` from `public.public_profiles`.
--
-- Why:
-- - `public_profiles` is readable by `anon`, so exposing `rol_id` lets anyone
--   enumerate which accounts are admins, operators, or stakeholders.
-- - The app only needs to know whether a profile is a guest (role 5) to keep
--   guests out of the community count and rankings.
--
-- This phase is additive and safe to apply before the app deploy: it appends
-- `es_invitado` while keeping `rol_id`, so the currently deployed code keeps
-- working. Phase 2 (`20261020120100_public_profiles_drop_rol_id.sql`) drops
-- `rol_id` and must be applied only after the app that reads `es_invitado` is
-- live.

begin;

create or replace view public.public_profiles as
select
  id,
  username,
  rol_id,
  puntos,
  created_at,
  rol_id is not distinct from 5 as es_invitado
from public.profiles;

alter view public.public_profiles set (security_invoker = false);

revoke insert, update, delete, truncate, references, trigger
  on table public.public_profiles from anon, authenticated;
grant select on table public.public_profiles to anon, authenticated;

commit;
