import { SupabaseClient } from "@supabase/supabase-js";
import { actualizarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Marca un reporte como eliminado estableciendo `deleted_at` y ajusta los puntos del usuario.
 *
 * @param reporteId - Identificador del reporte a eliminar.
 * @param usuarioId - Identificador del usuario que realiza la eliminación; solo el creador puede eliminar su propio reporte.
 * @returns Un objeto con `success` indicando si la operación tuvo éxito y `error` con el error ocurrido o `null`.
 */
export async function eliminarReporte(
  supabase: SupabaseClient,
  reporteId: number,
  usuarioId: string
) {
  const { error } = await supabase
    .from("reportes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reporteId)
    .eq("usuario_id", usuarioId); // Solo el creador puede eliminar

  if (error) {
    console.error("Error al eliminar reporte:", error);
    return { success: false, error };
  }

  // Restar puntos por eliminar el reporte
  await actualizarPuntos(
    supabase,
    usuarioId,
    PUNTOS.ELIMINAR_REPORTE_PROPIO,
    "Eliminar reporte propio"
  );

  return { success: true, error: null };
}