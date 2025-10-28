import { SupabaseClient } from "@supabase/supabase-js";

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

  return { success: true, error: null };
}
