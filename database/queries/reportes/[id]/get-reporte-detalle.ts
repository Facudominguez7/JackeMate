import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recupera el registro completo de un reporte identificado por su ID, incluyendo relaciones relacionadas.
 *
 * @param reporteId - ID del reporte a recuperar
 * @returns Un objeto con `data` y `error`. `data` contiene el reporte (campos: `id`, `titulo`, `descripcion`, `lat`, `lon`, `created_at`, `usuario_id`, `estado_id`, y relaciones `categorias.nombre`, `prioridades.nombre`, `estados.{id,nombre}`, `fotos_reporte.url`, `profiles.username`) o `null` si no se encontró; `error` contiene el error de la consulta o `null` si la operación tuvo éxito.
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