-- Restore `public.public_profiles` as a true safe public projection.
--
-- Why:
-- - `security_invoker = true` makes the view respect caller RLS.
-- - `public.profiles` is owner-only under RLS.
-- - As a result, shared identity surfaces (home ranking, authors, comments)
--   only see the caller's own profile row or no rows at all for anon users.

begin;

create or replace view public.public_profiles as
select
  id,
  username,
  rol_id,
  puntos,
  created_at
from public.profiles;

alter view public.public_profiles set (security_invoker = false);

comment on view public.public_profiles is
  'Safe public profile projection for shared identity surfaces. Excludes private columns like email and remains readable for public ranking, comments, and report authors.';

grant select on table public.public_profiles to anon, authenticated;

commit;
