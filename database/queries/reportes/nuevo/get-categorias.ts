import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Obtiene la lista de categorías disponibles para reportes.
 *
 * @returns Array de objetos con las propiedades `id` y `nombre`, ordenados por `nombre`. Devuelve un array vacío si ocurre un error o no se encuentran registros.
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