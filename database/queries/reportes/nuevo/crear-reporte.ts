import { SupabaseClient } from "@supabase/supabase-js"

export interface CrearReporteParams {
  usuarioId: string
  titulo: string
  descripcion: string
  categoriaId: number
  prioridadId: number
  lat: number | null
  lon: number | null
}

/**
 * Inserta un nuevo reporte en la tabla `reportes` y devuelve el registro creado.
 *
 * @param supabase - Cliente de Supabase usado para ejecutar la consulta
 * @param params - Parámetros del reporte a crear (usuarioId, titulo, descripcion, categoriaId, prioridadId, lat, lon)
 * @returns El registro insertado del reporte
 * @throws Error si la creación del reporte falla
 */
export async function crearReporte(supabase: SupabaseClient, params: CrearReporteParams) {
  const { data, error } = await supabase
    .from('reportes')
    .insert({
      usuario_id: params.usuarioId,
      titulo: params.titulo,
      descripcion: params.descripcion,
      categoria_id: params.categoriaId,
      prioridad_id: params.prioridadId,
      estado_id: 1, // 1 = Pendiente
      lat: params.lat,
      lon: params.lon
    })
    .select()
    .single()

  if (error) {
    console.error("Error al crear el reporte:", error)
    throw new Error("Error al crear el reporte")
  }

  return data
}