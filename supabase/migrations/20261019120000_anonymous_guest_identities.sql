-- Anonymous guest identities (Supabase Anonymous Sign-Ins).
--
-- Anonymous users share the `authenticated` Postgres role with permanent users,
-- so every guarantee below distinguishes them explicitly:
--   * profiles: anonymous users get the dedicated `invitado` role (id 5) instead of
--     the `ciudadano` default, and are promoted to `ciudadano` only once Supabase
--     Auth flips `auth.users.is_anonymous` to false (verified email / linked identity).
--   * points: the atomic points RPC never changes the balance of an `invitado`.
--   * RLS: restrictive policies block direct vote inserts and storage uploads from
--     anonymous JWTs (`is_anonymous` claim), on top of the existing permissive ones.
--   * storage: bucket `reportes` only accepts images up to the app limit.
--   * abuse: report submissions are rate limited by actor and hashed IP, with an
--     idempotency key per submission, through a service-role-only RPC.
--
-- Non-destructive: no rows are deleted. Existing anonymous profiles that still carry
-- the `ciudadano` default are moved to `invitado`; their stored points are kept but
-- they no longer appear in rankings or accumulate new points.

begin;

-- 1. Guest role ---------------------------------------------------------------

insert into public.roles (id, nombre)
values (5, 'invitado')
on conflict (id) do nothing;

-- 2. Profile sync: anonymous => invitado, conversion => ciudadano --------------

create or replace function private.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, private
as $$
begin
  insert into public.profiles (id, email, rol_id)
  values (
    new.id,
    new.email,
    case when coalesce(new.is_anonymous, false) then 5 else 2 end
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    -- Promote a guest only after Supabase Auth marks the identity as permanent.
    -- Never touch any other role (admin, interesado, operador stay as assigned).
    rol_id = case
      when public.profiles.rol_id = 5 and not coalesce(new.is_anonymous, false) then 2
      else public.profiles.rol_id
    end;

  return new;
end;
$$;

revoke all on function private.sync_profile_from_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of email, is_anonymous on auth.users
for each row
execute function private.sync_profile_from_auth_user();

update public.profiles as profiles
set rol_id = 5
from auth.users as users
where users.id = profiles.id
  and users.is_anonymous is true
  and profiles.rol_id = 2;

-- 3. Points: guests never accumulate points, directly or indirectly ------------

create or replace function public.adjust_profile_points_atomic(
  p_user_id uuid,
  p_delta integer,
  p_reason text default null
)
returns integer
language plpgsql
set search_path to ''
as $$
declare
  v_new_total integer;
begin
  update public.profiles
  set puntos = greatest(coalesce(puntos, 0) + coalesce(p_delta, 0), 0)
  where id = p_user_id
    and rol_id is distinct from 5
  returning puntos into v_new_total;

  if not found then
    -- Guest (or missing) profile: report the unchanged balance.
    select coalesce(puntos, 0) into v_new_total
    from public.profiles
    where id = p_user_id;
  end if;

  return v_new_total;
end;
$$;

revoke all on function public.adjust_profile_points_atomic(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.adjust_profile_points_atomic(uuid, integer, text) to service_role;

-- 4. RLS: anonymous JWTs cannot vote or upload directly ------------------------

drop policy if exists votos_no_existe_permanent_users_only on public.votos_no_existe;
create policy votos_no_existe_permanent_users_only
on public.votos_no_existe
as restrictive
for insert
to authenticated
with check ((select (auth.jwt() ->> 'is_anonymous')::boolean) is false);

drop policy if exists votos_reparado_permanent_users_only on public.votos_reparado;
create policy votos_reparado_permanent_users_only
on public.votos_reparado
as restrictive
for insert
to authenticated
with check ((select (auth.jwt() ->> 'is_anonymous')::boolean) is false);

-- Guest report images are uploaded by the trusted server workflow (service role),
-- so anonymous JWTs never need direct Storage writes.
drop policy if exists reportes_permanent_users_only_upload on storage.objects;
create policy reportes_permanent_users_only_upload
on storage.objects
as restrictive
for insert
to authenticated
with check ((select (auth.jwt() ->> 'is_anonymous')::boolean) is false);

-- 5. Storage limits aligned with lib/media/report-images.ts --------------------

update storage.buckets
set
  file_size_limit = 2621440, -- REPORT_IMAGE_MAX_BYTES (2.5 MB)
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'reportes';

-- 6. Report submission rate limiting and idempotency --------------------------

create table if not exists public.report_submission_attempts (
  id bigint generated always as identity primary key,
  submission_id uuid not null unique,
  actor_id uuid not null references auth.users (id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

comment on table public.report_submission_attempts is
  'Server-only ledger of report submissions used for rate limiting (actor + hashed IP) and duplicate prevention. No client access.';

create index if not exists report_submission_attempts_actor_created_idx
  on public.report_submission_attempts (actor_id, created_at desc);
create index if not exists report_submission_attempts_ip_created_idx
  on public.report_submission_attempts (ip_hash, created_at desc);

alter table public.report_submission_attempts enable row level security;
revoke all on table public.report_submission_attempts from anon, authenticated;

create or replace function public.claim_report_submission(
  p_submission_id uuid,
  p_actor_id uuid,
  p_ip_hash text,
  p_actor_window_seconds integer,
  p_actor_max integer,
  p_ip_window_seconds integer,
  p_ip_max integer
)
returns text
language plpgsql
set search_path to ''
as $$
declare
  v_count integer;
begin
  -- Serialize concurrent claims for the same IP and actor (lock order: IP, actor).
  perform pg_advisory_xact_lock(hashtextextended('report_submission:ip:' || p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('report_submission:actor:' || p_actor_id::text, 0));

  if exists (
    select 1 from public.report_submission_attempts where submission_id = p_submission_id
  ) then
    return 'duplicate';
  end if;

  delete from public.report_submission_attempts
  where (actor_id = p_actor_id or ip_hash = p_ip_hash)
    and created_at < now() - interval '2 days';

  select count(*) into v_count
  from public.report_submission_attempts
  where actor_id = p_actor_id
    and created_at > now() - make_interval(secs => p_actor_window_seconds);

  if v_count >= p_actor_max then
    return 'actor_limited';
  end if;

  select count(*) into v_count
  from public.report_submission_attempts
  where ip_hash = p_ip_hash
    and created_at > now() - make_interval(secs => p_ip_window_seconds);

  if v_count >= p_ip_max then
    return 'ip_limited';
  end if;

  insert into public.report_submission_attempts (submission_id, actor_id, ip_hash)
  values (p_submission_id, p_actor_id, p_ip_hash);

  return 'ok';
end;
$$;

revoke all on function public.claim_report_submission(uuid, uuid, text, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_report_submission(uuid, uuid, text, integer, integer, integer, integer) to service_role;

commit;
