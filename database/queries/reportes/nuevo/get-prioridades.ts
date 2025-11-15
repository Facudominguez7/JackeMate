import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Obtiene la lista de todas las prioridades disponibles para reportes.
 * 
 * @param supabase - Cliente de Supabase
 * @returns Lista de prioridades ordenadas por nombre
 */
export async function getPrioridades(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('prioridades')
    .select('id, nombre')
    .order('nombre')

  if (error) {
    console.error("Error al obtener prioridades:", error)
    return []
  }

  return data || []
}
