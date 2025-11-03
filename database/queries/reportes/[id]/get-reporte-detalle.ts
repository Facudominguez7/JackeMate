import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches full report details by ID from the "reportes" table.
 *
 * The returned record includes related entities: category and priority names, state id and name,
 * report photo URLs, and the reporting user's username.
 *
 * @param reporteId - The ID of the report to retrieve
 * @returns An object with `data` set to the report record (including related fields) or `null`, and `error` set to the Supabase error object or `null`
 */
export async function getReporteDetalle(supabase: SupabaseClient, reporteId: string) {
  const { data, error } = await supabase
    .from("reportes")
    .select(
      `
      id,
      titulo,
      descripcion,
      lat,
      lon,
      created_at,
      usuario_id,
      estado_id,
      categorias (nombre),
      prioridades (nombre),
      estados (id, nombre),
      fotos_reporte (url),
      profiles (username)
    `
    )
    .eq("id", reporteId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener reporte:", error);
    return { data: null, error };
  }

  return { data, error: null };
}