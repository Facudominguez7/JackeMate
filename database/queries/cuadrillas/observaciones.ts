import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

import { getPublicProfilesByIds, indexPublicProfilesById } from "@/database/queries/profiles"
import type { EstadoOperativo } from "@/lib/authz/catalog"

/** Observación registrada por una cuadrilla/operador sobre una asignación (`public.observaciones_cuadrilla`). */
export type ObservacionCuadrilla = {
  id: number
  asignacionId: number
  autorId: string
  autorUsername: string | null
  contenido: string
  observacionPublica: boolean
  estadoOperativoResultante: EstadoOperativo | null
  createdAt: string
}

type ObservacionRow = {
  id: number
  asignacion_id: number
  autor_id: string
  contenido: string
  observacion_publica: boolean
  estado_operativo_resultante: EstadoOperativo | null
  created_at: string
}

const OBSERVACION_COLUMNS =
  "id, asignacion_id, autor_id, contenido, observacion_publica, estado_operativo_resultante, created_at"

/**
 * Inserta una observación asociada a una asignación de cuadrilla.
 */
export async function insertarObservacion(
  supabase: SupabaseClient,
  datos: {
    asignacionId: number
    autorId: string
    contenido: string
    observacionPublica: boolean
    estadoOperativoResultante?: EstadoOperativo | null
  },
): Promise<{ data: ObservacionCuadrilla | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("observaciones_cuadrilla")
    .insert({
      asignacion_id: datos.asignacionId,
      autor_id: datos.autorId,
      contenido: datos.contenido,
      observacion_publica: datos.observacionPublica,
      estado_operativo_resultante: datos.estadoOperativoResultante ?? null,
    })
    .select(OBSERVACION_COLUMNS)
    .single()
    .returns<ObservacionRow>()

  if (error) {
    return { data: null, error }
  }

  return {
    data: {
      id: data.id,
      asignacionId: data.asignacion_id,
      autorId: data.autor_id,
      autorUsername: null,
      contenido: data.contenido,
      observacionPublica: data.observacion_publica,
      estadoOperativoResultante: data.estado_operativo_resultante,
      createdAt: data.created_at,
    },
    error: null,
  }
}

/**
 * Lista todas las observaciones (internas y públicas) de un reporte, uniendo por sus
 * asignaciones de cuadrilla, de la más reciente a la más antigua, con el username del autor
 * resuelto vía `public_profiles` (mismo patrón que `historial-estados.ts`).
 */
export async function listarObservacionesDeReporte(
  supabase: SupabaseClient,
  reporteId: number,
): Promise<{ data: ObservacionCuadrilla[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("observaciones_cuadrilla")
    .select(
      `
        id,
        asignacion_id,
        autor_id,
        contenido,
        observacion_publica,
        estado_operativo_resultante,
        created_at,
        asignacion:asignaciones_cuadrilla!inner(reporte_id)
      `,
    )
    .eq("asignacion.reporte_id", reporteId)
    .order("created_at", { ascending: false })
    .returns<ObservacionRow[]>()

  if (error) {
    console.error("Error al listar observaciones de cuadrilla del reporte:", error)
    return { data: [], error }
  }

  const rows = data ?? []
  const { data: profiles } = await getPublicProfilesByIds(
    supabase,
    rows.map((row) => row.autor_id),
  )
  const profilesById = indexPublicProfilesById(profiles)

  return {
    data: rows.map((row) => ({
      id: row.id,
      asignacionId: row.asignacion_id,
      autorId: row.autor_id,
      autorUsername: profilesById.get(row.autor_id)?.username ?? null,
      contenido: row.contenido,
      observacionPublica: row.observacion_publica,
      estadoOperativoResultante: row.estado_operativo_resultante,
      createdAt: row.created_at,
    })),
    error: null,
  }
}
