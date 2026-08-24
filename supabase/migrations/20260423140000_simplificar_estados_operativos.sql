-- Simplifica el ciclo operativo de una asignación de cuadrilla a dos estados:
--
--   en_progreso -> la cuadrilla está a cargo del reporte (se fija al asignar)
--   cerrada     -> la intervención terminó (el motivo_cierre dice cómo)
--
-- Se eliminan `asignada` y `en_revision`: en la práctica no aportaban una decisión
-- distinta, porque asignar ya implica que la cuadrilla está a cargo y la inspección
-- forma parte del trabajo. El detalle fino de qué pasó sigue quedando registrado en
-- `observaciones_cuadrilla`, que es donde corresponde narrarlo.
--
-- `motivo_cierre` NO cambia: sigue distinguiendo el cierre operativo (trabajo_finalizado,
-- cancelada, reasignada) del administrativo (reparado, rechazado).

begin;

-- 1. Normalizar filas existentes antes de ajustar los CHECK.
update public.asignaciones_cuadrilla
set estado_operativo = 'en_progreso'
where estado_operativo in ('asignada', 'en_revision');

update public.observaciones_cuadrilla
set estado_operativo_resultante = 'en_progreso'
where estado_operativo_resultante in ('asignada', 'en_revision');

-- 2. Reducir el dominio de `estado_operativo`.
alter table public.asignaciones_cuadrilla
  drop constraint if exists chk_asignacion_estado_operativo;

alter table public.asignaciones_cuadrilla
  add constraint chk_asignacion_estado_operativo
  check (estado_operativo in ('en_progreso', 'cerrada'));

-- 3. Asignar una cuadrilla ya significa "en progreso".
alter table public.asignaciones_cuadrilla
  alter column estado_operativo set default 'en_progreso';

-- 4. Mismo dominio para el estado resultante registrado en las observaciones.
alter table public.observaciones_cuadrilla
  drop constraint if exists chk_observacion_estado_resultante;

alter table public.observaciones_cuadrilla
  add constraint chk_observacion_estado_resultante
  check (estado_operativo_resultante is null or estado_operativo_resultante in ('en_progreso', 'cerrada'));

comment on column public.asignaciones_cuadrilla.estado_operativo is
  'Estado operativo de la intervención: `en_progreso` (cuadrilla a cargo) o `cerrada` (terminó). '
  'Es independiente de `reportes.estado_id`, que sigue siendo administrativo y solo lo cambia ADMIN. '
  'El índice idx_asignaciones_cuadrilla_activa_por_reporte usa `<> ''cerrada''`, así que sigue siendo '
  'estable frente a este cambio de dominio.';

commit;
