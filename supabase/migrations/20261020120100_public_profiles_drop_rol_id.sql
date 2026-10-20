-- Phase 2 of removing `rol_id` from `public.public_profiles`.
--
-- Apply only after the app that reads `es_invitado` instead of `rol_id` is
-- deployed: older app builds select `rol_id` from this view and would fail.
--
-- `create or replace view` cannot drop a column, so the view is recreated.
-- A recreated view receives Supabase's default grants again, so write
-- privileges are revoked explicitly (see 20261019180000).

begin;

drop view public.public_profiles;

create view public.public_profiles as
select
  id,
  username,
  puntos,
  created_at,
  rol_id is not distinct from 5 as es_invitado
from public.profiles;

alter view public.public_profiles set (security_invoker = false);

revoke all on table public.public_profiles from anon, authenticated;
grant select on table public.public_profiles to anon, authenticated;

comment on view public.public_profiles is
  'Safe public profile projection for shared identity surfaces. Excludes private columns like email and the role id; '
  'only exposes whether a profile is a guest (es_invitado). Remains readable for public ranking, comments, and report authors.';

commit;
