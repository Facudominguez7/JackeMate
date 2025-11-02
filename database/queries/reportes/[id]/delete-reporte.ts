import { SupabaseClient } from "@supabase/supabase-js";
import { actualizarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Realiza un soft delete de un reporte
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
