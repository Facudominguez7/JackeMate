-- RLS staff-only para las tablas de cuadrillas + proyecciones públicas
-- seguras para que ciudadanos/anónimos vean el estado operativo de un
-- reporte sin exponer las tablas base (que quedan solo para ADMIN/OPERADOR).

begin;

alter table public.cuadrillas enable row level security;
alter table public.asignaciones_cuadrilla enable row level security;
alter table public.observaciones_cuadrilla enable row level security;

-- No hay policies de insert/update/delete: todas las escrituras pasan por
-- `createAdminClient()` (service role), siguiendo el patrón de mutaciones
-- confiables ya establecido en el resto del repo.

drop policy if exists "cuadrillas_staff_read" on public.cuadrillas;
create policy "cuadrillas_staff_read"
on public.cuadrillas
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.rol_id in (1, 4)   -- ADMIN, OPERADOR — ver lib/authz/catalog.ts
  )
);

drop policy if exists "asignaciones_cuadrilla_staff_read" on public.asignaciones_cuadrilla;
create policy "asignaciones_cuadrilla_staff_read"
on public.asignaciones_cuadrilla
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.rol_id in (1, 4)   -- ADMIN, OPERADOR — ver lib/authz/catalog.ts
  )
);

drop policy if exists "observaciones_cuadrilla_staff_read" on public.observaciones_cuadrilla;
create policy "observaciones_cuadrilla_staff_read"
on public.observaciones_cuadrilla
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.rol_id in (1, 4)   -- ADMIN, OPERADOR — ver lib/authz/catalog.ts
  )
);

grant select on table public.cuadrillas to authenticated;
grant select on table public.asignaciones_cuadrilla to authenticated;
grant select on table public.observaciones_cuadrilla to authenticated;
-- Nunca se otorga select a `anon`: las tablas base son staff-only.

-- Proyección pública: estado operativo vigente (no cerrado) de un reporte
-- todavía abierto administrativamente.
create or replace view public.reportes_estado_operativo_publico as
select
  a.reporte_id,
  a.estado_operativo,
  c.nombre     as cuadrilla_nombre,
  a.updated_at as actualizado_at
from public.asignaciones_cuadrilla a
join public.cuadrillas c on c.id = a.cuadrilla_id
join public.reportes   r on r.id = a.reporte_id
where a.estado_operativo <> 'cerrada'
  and r.deleted_at is null
  and r.estado_id = 1;

-- Proyección pública: línea de tiempo operativa (asignación, cierre,
-- observaciones marcadas como públicas) de un reporte.
create or replace view public.reportes_linea_tiempo_operativa_publica as
select a.reporte_id, 'asignacion'::text as tipo_evento, a.created_at as ocurrido_at,
       c.nombre as cuadrilla_nombre, a.estado_operativo,
       null::text as motivo_cierre, null::text as contenido
from public.asignaciones_cuadrilla a
join public.cuadrillas c on c.id = a.cuadrilla_id
join public.reportes   r on r.id = a.reporte_id
where r.deleted_at is null
union all
select a.reporte_id, 'cierre'::text, a.cerrada_at,
       c.nombre, a.estado_operativo, a.motivo_cierre, null::text
from public.asignaciones_cuadrilla a
join public.cuadrillas c on c.id = a.cuadrilla_id
join public.reportes   r on r.id = a.reporte_id
where r.deleted_at is null and a.cerrada_at is not null
union all
select a.reporte_id, 'observacion'::text, o.created_at,
       c.nombre, coalesce(o.estado_operativo_resultante, a.estado_operativo),
       null::text, o.contenido
from public.observaciones_cuadrilla o
join public.asignaciones_cuadrilla a on a.id = o.asignacion_id
join public.cuadrillas c on c.id = a.cuadrilla_id
join public.reportes   r on r.id = a.reporte_id
where r.deleted_at is null and o.observacion_publica;

alter view public.reportes_estado_operativo_publico set (security_invoker = false);
alter view public.reportes_linea_tiempo_operativa_publica set (security_invoker = false);

grant select on table public.reportes_estado_operativo_publico to anon, authenticated;
grant select on table public.reportes_linea_tiempo_operativa_publica to anon, authenticated;

comment on view public.reportes_estado_operativo_publico is
  'Proyección pública segura del estado operativo vigente de un reporte: expone solo reporte_id, estado_operativo, '
  'cuadrilla_nombre y actualizado_at (allowlist de columnas), nunca las tablas base. '
  '`security_invoker = false` es obligatorio porque `asignaciones_cuadrilla`/`cuadrillas` son staff-only bajo RLS: '
  'con `true` esta vista devolvería cero filas para ciudadanos y visitantes anónimos. La seguridad viene de la '
  'allowlist de columnas y del filtro `r.estado_id = 1`, no del RLS del invocador — misma postura que '
  '`public_profiles` desde la migración 20260422170000. El filtro `r.estado_id = 1` garantiza que un reporte ya '
  'cerrado administrativamente nunca muestre un chip operativo desactualizado.';

comment on view public.reportes_linea_tiempo_operativa_publica is
  'Proyección pública segura de la línea de tiempo operativa de un reporte (asignación, cierre, observaciones '
  'públicas): expone solo reporte_id, tipo_evento, ocurrido_at, cuadrilla_nombre, estado_operativo, motivo_cierre '
  'y contenido (allowlist de columnas), nunca las tablas base. `security_invoker = false` es obligatorio porque '
  'las tablas base son staff-only bajo RLS: con `true` esta vista devolvería cero filas para ciudadanos y '
  'visitantes anónimos. La seguridad viene de la allowlist de columnas y del filtro `observacion_publica` sobre '
  'observaciones, no del RLS del invocador — misma postura que `public_profiles` desde la migración '
  '20260422170000.';

-- Nota: el linter de Supabase marcará `security_definer_view` en ambas vistas.
-- Es el mismo tradeoff aceptado y documentado que en `public_profiles`.

commit;
