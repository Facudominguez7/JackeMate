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
 * Crea un nuevo reporte en la base de datos.
 * 
 * @param supabase - Cliente de Supabase
 * @param params - Parámetros del reporte a crear
 * @returns El reporte creado o null si hubo un error
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
