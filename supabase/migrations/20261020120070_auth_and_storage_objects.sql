-- Objects production has inside the Supabase-managed `auth` and `storage` schemas.
--
-- `supabase db dump` skips those schemas, so the baseline (`20261020120050_remote_schema.sql`)
-- lacks the app's own objects there. Without them a local signup gets no profile and the bucket
-- accepts no uploads. Definitions copied from production on 2026-10-21; idempotent, so it changes
-- nothing there.

-- Creates and promotes `public.profiles` rows (see archive/migrations/20261019120000_anonymous_guest_identities.sql).
drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
  after insert or update of email, is_anonymous on auth.users
  for each row execute function private.sync_profile_from_auth_user();

-- Report photos: signed-in users upload to `reportes`, but guests cannot.
drop policy if exists reportes_authenticated_upload on storage.objects;
create policy reportes_authenticated_upload on storage.objects
  as permissive for insert to authenticated
  with check (bucket_id = 'reportes');

drop policy if exists reportes_permanent_users_only_upload on storage.objects;
create policy reportes_permanent_users_only_upload on storage.objects
  as restrictive for insert to authenticated
  with check ((select (auth.jwt() ->> 'is_anonymous')::boolean) is false);
