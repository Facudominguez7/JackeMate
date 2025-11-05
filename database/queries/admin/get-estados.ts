import { SupabaseClient } from "@supabase/supabase-js";

export type Estado = {
  id: number;
  nombre: string;
};

/**
 * Obtiene todos los estados disponibles para los reportes.
 * 
 * @param supabase - Cliente de Supabase
 * @returns Un objeto con `data` (array de estados) y `error` (null o el error ocurrido)
 */
export async function getEstados(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("estados")
    .select("id, nombre")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error al obtener estados:", error);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}
