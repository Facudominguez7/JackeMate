import type { AsignacionCuadrilla } from "@/database/queries/cuadrillas"
import { REPORT_STATE_IDS } from "@/lib/authz/catalog"
import { isAdminRole, puedeOperarCuadrillas } from "@/lib/authz/roles"

/** Acciones operativas posibles sobre la intervención de cuadrillas de un reporte. */
export type AccionOperativa =
  | "asignar"
  | "reasignar"
  | "finalizar_trabajo"
  | "cancelar"
  | "observar"
  | "cerrar_reparado"
  | "cerrar_rechazado"

/**
 * Única fuente de verdad de la tabla de transiciones operativas de cuadrillas. Es una
 * función PURA (sin I/O): tanto la UI (para decidir qué botones mostrar) como cada workflow
 * de `lib/use-cases/cuadrillas` (para revalidar la acción antes de mutar, cerrando la ventana
 * entre que el cliente pidió la acción y el servidor la ejecuta) llaman a esta misma función.
 *
 * Tabla de transiciones (el estado operativo abierto es siempre `en_progreso`: asignar ya
 * pone la cuadrilla a cargo, y la inspección forma parte del trabajo):
 * - sin asignación abierta            → `asignar`                              (ADMIN, OPERADOR)
 * - asignación abierta                → `reasignar`, `finalizar_trabajo` (motivo `trabajo_finalizado`),
 *                                        `cancelar` (motivo `cancelada`), `observar` (ADMIN, OPERADOR)
 * - reporte Pendiente (`estado_id = 1`) y no eliminado → `cerrar_reparado`, `cerrar_rechazado` (solo ADMIN)
 *
 * Reglas: no hay transiciones hacia atrás. Nada está disponible si `reporteEliminado` es
 * `true`. Ninguna acción operativa está disponible si el reporte ya está cerrado
 * (`estado_id` 2 o 3). `cerrar_reparado`/`cerrar_rechazado` son exclusivas de ADMIN y NO
 * requieren una asignación abierta: es un requisito de retrocompatibilidad — ADMIN conserva
 * la potestad de cierre unilateral que ya tenía sobre los 24 reportes previos a esta feature.
 */
export function calcularAccionesDisponibles(params: {
  roleId: number | null
  estadoReporteId: number | null
  reporteEliminado: boolean
  asignacionAbierta: AsignacionCuadrilla | null
}): AccionOperativa[] {
  const { roleId, estadoReporteId, reporteEliminado, asignacionAbierta } = params

  if (reporteEliminado) {
    return []
  }

  const acciones: AccionOperativa[] = []

  if (isAdminRole(roleId) && estadoReporteId === REPORT_STATE_IDS.PENDIENTE) {
    acciones.push("cerrar_reparado", "cerrar_rechazado")
  }

  const reporteYaCerrado =
    estadoReporteId === REPORT_STATE_IDS.REPARADO || estadoReporteId === REPORT_STATE_IDS.RECHAZADO

  if (!puedeOperarCuadrillas(roleId) || reporteYaCerrado) {
    return acciones
  }

  if (!asignacionAbierta) {
    acciones.push("asignar")
    return acciones
  }

  acciones.push("reasignar", "finalizar_trabajo", "cancelar", "observar")

  return acciones
}
