-- Public profiles projection + RLS rollout for `public.profiles`.
--
-- We intentionally expose shared identity through a dedicated view that omits
-- private columns such as `email`. The base table then moves to owner-only RLS
-- for session-based reads, while trusted server/service-role boundaries continue
-- to resolve private contact data directly from `public.profiles`.

begin;

create or replace view public.public_profiles as
select
  id,
  username,
  rol_id,
  puntos,
  created_at
from public.profiles;

comment on view public.public_profiles is
  'Safe public profile projection for shared identity surfaces. Excludes private columns like email.';

grant select on table public.public_profiles to anon, authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_owner_read" on public.profiles;

create policy "profiles_owner_read"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

commit;
