import { SupabaseClient } from "@supabase/supabase-js";
import { actualizarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Performs a soft delete of a report when requested by its creator.
 *
 * @param reporteId - Identifier of the report to mark as deleted
 * @param usuarioId - ID of the user attempting the delete; only the report's creator is allowed
 * @returns An object with `success` and `error`: `success` is `true` if the report was marked deleted, `false` otherwise; `error` contains the Supabase error when the operation fails or `null` on success
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