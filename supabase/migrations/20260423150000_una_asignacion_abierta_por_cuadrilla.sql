-- Regla nueva: una cuadrilla puede estar trabajando en un solo reporte a la vez.
--
-- Hasta ahora la unicidad era solo del lado del reporte
-- (idx_asignaciones_cuadrilla_activa_por_reporte), así que una misma cuadrilla podía
-- quedar asignada a varios reportes simultáneamente. Este índice cierra el otro lado
-- con exactamente el mismo mecanismo, espejado: un índice único parcial sobre las
-- filas que no están cerradas.
--
-- Igual que su par, es la ÚNICA autoridad sobre la invariante: la aplicación no la
-- verifica leyendo primero (eso sería una carrera), sino que intenta el INSERT y
-- traduce el 23505 resultante a un mensaje para el operador.

begin;

create unique index if not exists idx_asignaciones_cuadrilla_ocupada
  on public.asignaciones_cuadrilla (cuadrilla_id) where estado_operativo <> 'cerrada';

comment on index public.idx_asignaciones_cuadrilla_ocupada is
  'A lo sumo una asignación abierta por cuadrilla: una cuadrilla trabaja en un reporte a la vez. '
  'Espejo de idx_asignaciones_cuadrilla_activa_por_reporte, que impone lo mismo del lado del reporte.';

commit;
