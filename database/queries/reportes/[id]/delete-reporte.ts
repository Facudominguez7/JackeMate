import { SupabaseClient } from "@supabase/supabase-js";
import { actualizarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Soft-deletes a report when requested by the report's creator.
 *
 * @param reporteId - The ID of the report to soft-delete.
 * @param usuarioId - The ID of the requesting user; deletion is performed only if this user is the report's creator.
 * @returns An object with `success` set to `true` and `error` set to `null` on success; `success` set to `false` and `error` containing the failure details on error.
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