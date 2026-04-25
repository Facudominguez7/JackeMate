-- Ensure every auth user (including anonymous) has a base profile row.

begin;

create schema if not exists private;

create or replace function private.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, private
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email);

  return new;
end;
$$;

revoke all on function private.sync_profile_from_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of email on auth.users
for each row
execute function private.sync_profile_from_auth_user();

insert into public.profiles (id, email)
select
  users.id,
  users.email
from auth.users as users
left join public.profiles as profiles
  on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;

commit;
