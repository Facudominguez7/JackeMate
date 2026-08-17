import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import { REPORT_STATE_IDS } from "@/lib/authz/catalog"

/** Reporte pendiente, no eliminado y sin asignación de cuadrilla abierta: candidato válido para el flujo "asignar cuadrilla". */
export type ReporteAsignable = {
  id: number
  titulo: string
  createdAt: string
}

/**
 * Lista los reportes pendientes (`estado_id = 1`), no eliminados y sin una asignación de
 * cuadrilla abierta, de más antiguo a más nuevo.
 *
 * ponytail: PostgREST no permite un `NOT IN` con subquery embebida sobre otra tabla en un
 * único request, así que se resuelve con dos lecturas: primero los `reporte_id` con
 * asignación abierta, después los reportes que no estén en ese conjunto. Ventana de carrera
 * mínima e inofensiva: en el peor caso el listado muestra por un instante un reporte que otro
 * operador acaba de asignar, y `insertarAsignacion` rechaza igual el intento duplicado.
 */
export async function listarReportesAsignables(
  supabase: SupabaseClient,
  limite = 50,
): Promise<{ data: ReporteAsignable[]; error: PostgrestError | null }> {
  const { data: abiertas, error: errorAbiertas } = await supabase
    .from("asignaciones_cuadrilla")
    .select("reporte_id")
    .neq("estado_operativo", "cerrada")

  if (errorAbiertas) {
    console.error("Error al listar reportes con asignación abierta:", errorAbiertas)
    return { data: [], error: errorAbiertas }
  }

  const idsConAsignacion = (abiertas ?? []).map((fila) => fila.reporte_id)

  let query = supabase
    .from("reportes")
    .select("id, titulo, created_at")
    .eq("estado_id", REPORT_STATE_IDS.PENDIENTE)
    .is("deleted_at", null)

  if (idsConAsignacion.length > 0) {
    query = query.not("id", "in", `(${idsConAsignacion.join(",")})`)
  }

  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(limite)
    .returns<{ id: number; titulo: string; created_at: string }[]>()

  if (error) {
    console.error("Error al listar reportes asignables:", error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map((fila) => ({ id: fila.id, titulo: fila.titulo, createdAt: fila.created_at })),
    error: null,
  }
}
