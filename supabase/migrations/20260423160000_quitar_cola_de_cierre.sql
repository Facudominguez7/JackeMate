-- Elimina el motivo de cierre `trabajo_finalizado` y la cola de cierre administrativo.
--
-- El modelo anterior asumía que la cuadrilla usaba el sistema: marcaba "terminé" y un
-- administrador confirmaba después. En la práctica la cuadrilla nunca entra a la aplicación:
-- hay una o pocas personas operando desde un escritorio que actualizan a medida que la
-- cuadrilla les informa por radio o teléfono. El paso intermedio era una ceremonia entre esa
-- persona y ella misma, y dejaba reportes esperando una confirmación que nadie iba a dar.
--
-- Ciclo resultante, de dos pasos:
--   asignar  -> en_progreso
--   cerrar   -> cerrada + motivo
--
-- Motivos que quedan:
--   reparado / rechazado -> resuelven el reporte y propagan a `reportes.estado_id`
--   cancelada            -> se levanta la intervención, el reporte vuelve a quedar sin cuadrilla
--   reasignada           -> cierre técnico al pasar el trabajo a otra cuadrilla

begin;

-- 1. Sin filas con el motivo eliminado (verificado antes de aplicar), pero el UPDATE queda
--    por idempotencia si la migración corre sobre otro entorno.
update public.asignaciones_cuadrilla
set motivo_cierre = 'reparado'
where motivo_cierre = 'trabajo_finalizado';

-- 2. El índice de la cola de cierre filtraba justamente por ese motivo: ya no tiene sentido.
drop index if exists public.idx_asignaciones_cuadrilla_cola_cierre;

-- 3. Reducir el dominio de motivos.
alter table public.asignaciones_cuadrilla
  drop constraint if exists chk_asignacion_motivo_cierre;

alter table public.asignaciones_cuadrilla
  add constraint chk_asignacion_motivo_cierre
  check (motivo_cierre is null or motivo_cierre in ('cancelada', 'reasignada', 'reparado', 'rechazado'));

comment on column public.asignaciones_cuadrilla.motivo_cierre is
  'Motivo de cierre de la asignación. `reparado` y `rechazado` resuelven el reporte y propagan '
  'a `reportes.estado_id` (con puntos y correo al ciudadano); `cancelada` y `reasignada` cierran '
  'solo la intervención y nunca tocan el estado del reporte.';

commit;
