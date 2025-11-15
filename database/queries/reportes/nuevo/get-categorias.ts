import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Obtiene la lista de todas las categorías disponibles para reportes.
 * 
 * @param supabase - Cliente de Supabase
 * @returns Lista de categorías ordenadas por nombre
 */
export async function getCategorias(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('nombre')

  if (error) {
    console.error("Error al obtener categorías:", error)
    return []
  }

  return data || []
}
