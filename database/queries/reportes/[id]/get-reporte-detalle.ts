import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene los detalles completos de un reporte por ID
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
