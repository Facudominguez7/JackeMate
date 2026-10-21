-- Compatibility-first image rollout for `project-hygiene-supabase-boundaries`.
--
-- Goals for this batch:
-- 1. Introduce canonical `bucket` / `path` columns without breaking legacy `url` readers.
-- 2. Backfill existing `fotos_reporte` rows in a resumable, idempotent way.
-- 3. Tighten only the RLS/policy surface proven safe in this batch:
--    - read-only lookup tables (`roles`, `estados`)
--    - report image metadata table (`fotos_reporte`)
--    - public storage bucket `reportes` listing policy removal
--
-- This migration is intentionally incremental. It does NOT yet enable RLS on
-- `reportes`, `profiles`, comments, votes, or historial tables because the
-- server-owned mutation rollout for those surfaces is still in progress.

begin;

alter table public.fotos_reporte
  add column if not exists bucket text,
  add column if not exists path text;

comment on column public.fotos_reporte.bucket is
  'Canonical Supabase Storage bucket for the report image. Legacy url reads remain during the transition.';

comment on column public.fotos_reporte.path is
  'Canonical Supabase Storage object path for the report image. Populated by upload dual-write and resumable backfill.';

-- Resumable backfill: safe to run multiple times because existing canonical
-- values are preserved with COALESCE.
update public.fotos_reporte
set
  bucket = coalesce(
    bucket,
    (regexp_match(url, '/storage/v1/object/(?:public|sign)/([^/]+)/'))[1]
  ),
  path = coalesce(
    path,
    (regexp_match(url, '/storage/v1/object/(?:public|sign)/[^/]+/(.+)$'))[1]
  )
where url is not null
  and (bucket is null or path is null)
  and url ~ '/storage/v1/object/(public|sign)/';

create index if not exists idx_fotos_reporte_reporte_id
  on public.fotos_reporte (reporte_id);

create index if not exists idx_fotos_reporte_bucket_path
  on public.fotos_reporte (bucket, path)
  where bucket is not null and path is not null;

alter table public.roles enable row level security;
alter table public.estados enable row level security;
alter table public.fotos_reporte enable row level security;

drop policy if exists "Usuarios autenticados pueden hacer todo en estados" on public.estados;
drop policy if exists "roles_public_read" on public.roles;
drop policy if exists "estados_public_read" on public.estados;
drop policy if exists "fotos_reporte_visible_read" on public.fotos_reporte;
drop policy if exists "fotos_reporte_owner_insert" on public.fotos_reporte;

create policy "roles_public_read"
on public.roles
for select
to anon, authenticated
using (true);

create policy "estados_public_read"
on public.estados
for select
to anon, authenticated
using (true);

create policy "fotos_reporte_visible_read"
on public.fotos_reporte
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.reportes
    where reportes.id = fotos_reporte.reporte_id
      and reportes.deleted_at is null
  )
);

create policy "fotos_reporte_owner_insert"
on public.fotos_reporte
for insert
to authenticated
with check (
  exists (
    select 1
    from public.reportes
    where reportes.id = fotos_reporte.reporte_id
      and reportes.usuario_id = auth.uid()
      and reportes.deleted_at is null
  )
);

-- Public buckets do not require a broad `storage.objects` SELECT policy for
-- public URL access, so remove listing exposure and keep only authenticated upload.
drop policy if exists "Permitir ver imagenes del bucket reportes" on storage.objects;
drop policy if exists "Permitir actualizar imagenes propias en reportes" on storage.objects;
drop policy if exists "Permitir borrar imagenes propias o del bucket reportes" on storage.objects;
drop policy if exists "Permitir subir imagenes a usuarios autenticados en reportes" on storage.objects;

create policy "reportes_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'reportes'
);

commit;
