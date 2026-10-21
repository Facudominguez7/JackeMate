begin;

alter table public.fotos_reporte
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_bucket text,
  add column if not exists thumbnail_path text;

comment on column public.fotos_reporte.thumbnail_url is
  'Backward-compatible public thumbnail URL for compact report cards while canonical storage references roll out.';

comment on column public.fotos_reporte.thumbnail_bucket is
  'Canonical Supabase Storage bucket for the compact report thumbnail.';

comment on column public.fotos_reporte.thumbnail_path is
  'Canonical Supabase Storage object path for the compact report thumbnail.';

create index if not exists idx_fotos_reporte_thumbnail_bucket_path
  on public.fotos_reporte (thumbnail_bucket, thumbnail_path)
  where thumbnail_bucket is not null and thumbnail_path is not null;

commit;
