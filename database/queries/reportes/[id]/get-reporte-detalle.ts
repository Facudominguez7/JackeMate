import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches the full detail of a report by its ID.
 *
 * Retrieves the report record (including `categorias(nombre)`, `prioridades(nombre)`, `estados(id, nombre)`, `fotos_reporte(url)`, and `profiles(username)`) only if the record is not soft-deleted.
 *
 * @param reporteId - The report's `id` to fetch
 * @returns An object with `data` set to the report record including related fields when found, `data` is `null` and `error` contains the error information when the query fails
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