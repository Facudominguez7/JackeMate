import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Obtiene las prioridades disponibles para reportes.
 *
 * @returns Una matriz de objetos con las propiedades `id` y `nombre`, ordenada por `nombre`; devuelve una matriz vacía si no hay datos o si ocurre un error.
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