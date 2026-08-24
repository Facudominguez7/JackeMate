-- Esquema base para la gestión de cuadrillas municipales y su intervención
-- operativa sobre los reportes: catálogo de cuadrillas, asignaciones y
-- observaciones de seguimiento.
--
-- Todas las tablas se crean con `create table if not exists` y sus checks/FKs
-- inline para que la migración sea atómicamente idempotente.

begin;

create table if not exists public.cuadrillas (
  id bigint generated always as identity primary key,
  nombre text not null,
  descripcion text null,
  telefono text null,
  activa boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint chk_cuadrillas_nombre check (char_length(btrim(nombre)) between 3 and 120),
  constraint chk_cuadrillas_descripcion check (descripcion is null or char_length(descripcion) <= 500),
  constraint chk_cuadrillas_telefono check (telefono is null or char_length(btrim(telefono)) between 1 and 40)
);

create unique index if not exists idx_cuadrillas_nombre_unico
  on public.cuadrillas (lower(btrim(nombre)));

create index if not exists idx_cuadrillas_activas
  on public.cuadrillas (nombre) where activa;

create table if not exists public.asignaciones_cuadrilla (
  id bigint generated always as identity primary key,
  reporte_id bigint not null references public.reportes(id) on delete cascade,
  cuadrilla_id bigint not null references public.cuadrillas(id) on delete restrict,
  asignada_por uuid null references public.profiles(id) on delete set null,
  estado_operativo text not null default 'asignada',
  motivo_cierre text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  cerrada_at timestamptz null,
  constraint chk_asignacion_estado_operativo check (estado_operativo in ('asignada', 'en_revision', 'en_progreso', 'cerrada')),
  constraint chk_asignacion_motivo_cierre check (motivo_cierre is null or motivo_cierre in ('trabajo_finalizado', 'cancelada', 'reasignada', 'reparado', 'rechazado')),
  constraint chk_asignacion_cierre_coherente check ((estado_operativo = 'cerrada') = (motivo_cierre is not null)),
  constraint chk_asignacion_cerrada_at_coherente check ((estado_operativo = 'cerrada') = (cerrada_at is not null))
);

-- Única autoridad para la regla "a lo sumo una asignación abierta por reporte":
-- un índice único parcial sobre las filas que no están cerradas.
create unique index if not exists idx_asignaciones_cuadrilla_activa_por_reporte
  on public.asignaciones_cuadrilla (reporte_id) where estado_operativo <> 'cerrada';

create index if not exists idx_asignaciones_cuadrilla_reporte_id
  on public.asignaciones_cuadrilla (reporte_id);

create index if not exists idx_asignaciones_cuadrilla_cuadrilla_id
  on public.asignaciones_cuadrilla (cuadrilla_id);

create index if not exists idx_asignaciones_cuadrilla_asignada_por
  on public.asignaciones_cuadrilla (asignada_por) where asignada_por is not null;

create index if not exists idx_asignaciones_cuadrilla_cola_cierre
  on public.asignaciones_cuadrilla (cerrada_at desc)
  where estado_operativo = 'cerrada' and motivo_cierre = 'trabajo_finalizado';

create table if not exists public.observaciones_cuadrilla (
  id bigint generated always as identity primary key,
  asignacion_id bigint not null references public.asignaciones_cuadrilla(id) on delete cascade,
  autor_id uuid null references public.profiles(id) on delete set null,
  contenido text not null,
  observacion_publica boolean not null default false,
  estado_operativo_resultante text null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chk_observacion_contenido check (char_length(btrim(contenido)) between 1 and 1000),
  constraint chk_observacion_estado_resultante check (estado_operativo_resultante is null or estado_operativo_resultante in ('asignada', 'en_revision', 'en_progreso', 'cerrada'))
);

create index if not exists idx_observaciones_cuadrilla_asignacion
  on public.observaciones_cuadrilla (asignacion_id, created_at desc);

create index if not exists idx_observaciones_cuadrilla_autor
  on public.observaciones_cuadrilla (autor_id) where autor_id is not null;

create index if not exists idx_observaciones_cuadrilla_publicas
  on public.observaciones_cuadrilla (asignacion_id, created_at desc) where observacion_publica;

comment on table public.cuadrillas is
  'Catálogo de cuadrillas municipales que pueden ser asignadas a reportes para su intervención en campo.';

comment on table public.asignaciones_cuadrilla is
  'Asignación de una cuadrilla a un reporte y su ciclo de vida operativo (asignada -> en_revision/en_progreso -> cerrada). '
  'A lo sumo una asignación abierta por reporte (ver idx_asignaciones_cuadrilla_activa_por_reporte).';

comment on table public.observaciones_cuadrilla is
  'Bitácora de observaciones de seguimiento sobre una asignación de cuadrilla, con visibilidad opcional al público.';

comment on column public.asignaciones_cuadrilla.estado_operativo is
  'Estado operativo interno de la intervención de la cuadrilla (asignada, en_revision, en_progreso, cerrada). '
  'Es independiente de `reportes.estado_id`, que sigue siendo administrativo y solo lo cambia ADMIN.';

comment on column public.asignaciones_cuadrilla.motivo_cierre is
  'Motivo de cierre de la asignación. Los motivos operativos (trabajo_finalizado, cancelada, reasignada) los registra '
  'OPERADOR/ADMIN y nunca tocan `reportes.estado_id`. Los motivos administrativos (reparado, rechazado) son '
  'exclusivos de ADMIN y sí confirman el estado final del reporte.';

comment on column public.observaciones_cuadrilla.observacion_publica is
  'Indica si la observación es visible en la proyección pública de línea de tiempo operativa del reporte.';

commit;
