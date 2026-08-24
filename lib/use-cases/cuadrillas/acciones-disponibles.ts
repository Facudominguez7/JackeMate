import type { AsignacionCuadrilla } from "@/database/queries/cuadrillas"
import { REPORT_STATE_IDS } from "@/lib/authz/catalog"
import { puedeOperarCuadrillas } from "@/lib/authz/roles"

/** Acciones operativas posibles sobre la intervención de cuadrillas de un reporte. */
export type AccionOperativa =
  | "asignar"
  | "reasignar"
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
 * - sin asignación abierta            → `asignar`, `cerrar_reparado`, `cerrar_rechazado` (ADMIN, OPERADOR)
 * - asignación abierta                → `reasignar`, `cancelar` (motivo `cancelada`), `observar`,
 *                                        `cerrar_reparado`, `cerrar_rechazado` (ADMIN, OPERADOR)
 *
 * Reglas: no hay transiciones hacia atrás. Nada está disponible si `reporteEliminado` es
 * `true`. Ninguna acción operativa está disponible si el reporte ya está cerrado
 * (`estado_id` 2 o 3). `cerrar_reparado`/`cerrar_rechazado` NO requieren una asignación
 * abierta: ADMIN y OPERADOR conservan la potestad de cierre unilateral sobre un reporte que
 * nunca tuvo cuadrilla.
 */
export function calcularAccionesDisponibles(params: {
  roleId: number | null
  estadoReporteId: number | null
  reporteEliminado: boolean
  asignacionAbierta: AsignacionCuadrilla | null
}): AccionOperativa[] {
  const { roleId, estadoReporteId, reporteEliminado, asignacionAbierta } = params

  const reporteYaCerrado =
    estadoReporteId === REPORT_STATE_IDS.REPARADO || estadoReporteId === REPORT_STATE_IDS.RECHAZADO

  if (reporteEliminado || reporteYaCerrado || !puedeOperarCuadrillas(roleId)) {
    return []
  }

  const acciones: AccionOperativa[] = ["cerrar_reparado", "cerrar_rechazado"]

  if (!asignacionAbierta) {
    acciones.push("asignar")
    return acciones
  }

  acciones.push("reasignar", "cancelar", "observar")

  return acciones
}
