import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Fetches the priorities available for reports.
 *
 * @returns An array of objects with `id` and `nombre`, ordered by descending `id`; returns an empty array if no data is found or an error occurs.
 */
export async function getPrioridades(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('prioridades')
    .select('id, nombre')
    .order('id', { ascending: false })

  if (error) {
    console.error("Error al obtener prioridades:", error)
    return []
  }

  return data || []
}
