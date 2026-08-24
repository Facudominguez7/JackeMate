import type { SupabaseClient } from "@supabase/supabase-js"

/** Fila pública de la vista `reportes_estado_operativo_publico`. */
export type EstadoOperativoPublico = {
  reporteId: number
  estadoOperativo: string
  cuadrillaNombre: string | null
  actualizadoAt: string
}

/** Fila pública de la vista `reportes_linea_tiempo_operativa_publica`. */
export type EventoOperativoPublico = {
  reporteId: number
  tipoEvento: string
  ocurridoAt: string
  cuadrillaNombre: string | null
  estadoOperativo: string | null
  motivoCierre: string | null
  contenido: string | null
}

/**
 * Obtiene el estado operativo público (vista `reportes_estado_operativo_publico`) para un
 * conjunto de reportes.
 *
 * Degrada en silencio: cualquier fallo se loguea con `console.error` y devuelve un `Map`
 * vacío. Esta lectura es un enriquecimiento del mapa/listado de reportes; nunca debe
 * romperlos, por eso nunca lanza (`throw`).
 */
export async function obtenerEstadoOperativoPublicoPorReporte(
  supabase: SupabaseClient,
  reporteIds: number[],
): Promise<Map<number, EstadoOperativoPublico>> {
  if (reporteIds.length === 0) {
    return new Map()
  }

  try {
    const { data, error } = await supabase
      .from("reportes_estado_operativo_publico")
      .select("reporte_id, estado_operativo, cuadrilla_nombre, actualizado_at")
      .in("reporte_id", reporteIds)

    if (error) {
      console.error("Error al obtener el estado operativo público de reportes:", error)
      return new Map()
    }

    return new Map(
      (data ?? []).map((row) => [
        row.reporte_id as number,
        {
          reporteId: row.reporte_id,
          estadoOperativo: row.estado_operativo,
          cuadrillaNombre: row.cuadrilla_nombre,
          actualizadoAt: row.actualizado_at,
        } as EstadoOperativoPublico,
      ]),
    )
  } catch (error) {
    console.error("Error inesperado al obtener el estado operativo público de reportes:", error)
    return new Map()
  }
}

/**
 * Cuenta los reportes que actualmente están "en progreso" según la vista pública.
 *
 * Degrada en silencio: cualquier fallo devuelve `0` en lugar de lanzar.
 */
export async function contarReportesEnProgreso(supabase: SupabaseClient): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("reportes_estado_operativo_publico")
      .select("reporte_id", { count: "exact", head: true })
      .eq("estado_operativo", "en_progreso")

    if (error) {
      console.error("Error al contar reportes en progreso:", error)
      return 0
    }

    return count ?? 0
  } catch (error) {
    console.error("Error inesperado al contar reportes en progreso:", error)
    return 0
  }
}

/**
 * Lista la línea de tiempo operativa pública (vista `reportes_linea_tiempo_operativa_publica`)
 * de un reporte, de la más reciente a la más antigua.
 *
 * Degrada en silencio: cualquier fallo devuelve `[]` en lugar de lanzar.
 */
export async function listarEventosOperativosPublicos(
  supabase: SupabaseClient,
  reporteId: number,
): Promise<EventoOperativoPublico[]> {
  try {
    const { data, error } = await supabase
      .from("reportes_linea_tiempo_operativa_publica")
      .select("reporte_id, tipo_evento, ocurrido_at, cuadrilla_nombre, estado_operativo, motivo_cierre, contenido")
      .eq("reporte_id", reporteId)
      .order("ocurrido_at", { ascending: false })

    if (error) {
      console.error("Error al listar los eventos operativos públicos del reporte:", error)
      return []
    }

    return (data ?? []).map((row) => ({
      reporteId: row.reporte_id,
      tipoEvento: row.tipo_evento,
      ocurridoAt: row.ocurrido_at,
      cuadrillaNombre: row.cuadrilla_nombre,
      estadoOperativo: row.estado_operativo,
      motivoCierre: row.motivo_cierre,
      contenido: row.contenido,
    }))
  } catch (error) {
    console.error("Error inesperado al listar los eventos operativos públicos del reporte:", error)
    return []
  }
}
