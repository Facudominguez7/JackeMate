-- Trusted server mutations + incremental RLS rollout for
-- `project-hygiene-supabase-boundaries`.
--
-- This batch is intentionally compatibility-first:
-- 1. Add only advisor-backed foreign-key indexes observed in the live project.
-- 2. Enable RLS on tables whose browser access is read-only after trusted server
--    actions moved mutations behind server-owned boundaries.
-- 3. Keep `profiles` and vote tables for a later batch because current browser
--    reads still need a narrower policy/view strategy.

begin;

create index if not exists idx_profiles_rol_id
  on public.profiles (rol_id)
  where rol_id is not null;

create index if not exists idx_reportes_usuario_id
  on public.reportes (usuario_id)
  where usuario_id is not null;

create index if not exists idx_reportes_categoria_id
  on public.reportes (categoria_id)
  where categoria_id is not null;

create index if not exists idx_reportes_prioridad_id
  on public.reportes (prioridad_id)
  where prioridad_id is not null;

create index if not exists idx_reportes_estado_id
  on public.reportes (estado_id)
  where estado_id is not null;

alter table public.reportes enable row level security;
alter table public.comentarios_reporte enable row level security;
alter table public.historial_estados enable row level security;

drop policy if exists "reportes_public_read" on public.reportes;
drop policy if exists "comentarios_reporte_visible_read" on public.comentarios_reporte;
drop policy if exists "historial_estados_visible_read" on public.historial_estados;

create policy "reportes_public_read"
on public.reportes
for select
to anon, authenticated
using (deleted_at is null);

create policy "comentarios_reporte_visible_read"
on public.comentarios_reporte
for select
to anon, authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.reportes
    where reportes.id = comentarios_reporte.reporte_id
      and reportes.deleted_at is null
  )
);

create policy "historial_estados_visible_read"
on public.historial_estados
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.reportes
    where reportes.id = historial_estados.reporte_id
      and reportes.deleted_at is null
  )
);

commit;
