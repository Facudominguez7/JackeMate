import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Obtiene la lista de categorías disponibles para reportes.
 *
 * @returns Array de objetos con las propiedades `id` y `nombre`, con "Otros" siempre al final. Devuelve un array vacío si ocurre un error o no se encuentran registros.
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

  return (data || []).sort((a, b) => {
    const aIsOther = a.nombre.localeCompare("Otros", "es", { sensitivity: "base" }) === 0
    const bIsOther = b.nombre.localeCompare("Otros", "es", { sensitivity: "base" }) === 0

    if (aIsOther !== bIsOther) {
      return aIsOther ? 1 : -1
    }

    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  })
}
