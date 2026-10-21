-- Ensure the public profile projection respects the querying role/RLS.

begin;

create or replace view public.public_profiles
with (security_invoker = true) as
select
  id,
  username,
  rol_id,
  puntos,
  created_at
from public.profiles;

alter view public.public_profiles set (security_invoker = true);

comment on view public.public_profiles is
  'Safe public profile projection for shared identity surfaces. Excludes private columns like email and respects caller RLS via security_invoker.';

grant select on table public.public_profiles to anon, authenticated;

commit;
