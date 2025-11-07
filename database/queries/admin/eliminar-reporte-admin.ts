import { SupabaseClient } from "@supabase/supabase-js";
import { verificarEsAdmin } from "./verificar-admin";

/**
 * Elimina un reporte (soft delete). Solo usuarios con rol admin pueden ejecutar esta acción.
 * 
 * A diferencia de la función eliminarReporte normal, esta permite al admin eliminar
 * cualquier reporte, no solo los propios.
 * 
 * @param supabase - Cliente de Supabase
 * @param reporteId - ID del reporte a eliminar
 * @param usuarioId - ID del usuario admin que realiza la eliminación
 * @returns Un objeto con `success` (boolean) y `error` (null o el error ocurrido)
 */
export async function eliminarReporteAdmin(
  supabase: SupabaseClient,
  reporteId: number,
  usuarioId: string
) {
  // Verificar que el usuario sea admin
  const { isAdmin, error: adminError } = await verificarEsAdmin(supabase, usuarioId);

  if (adminError) {
    console.error("Error al verificar permisos de admin:", adminError);
    return { success: false, error: adminError };
  }

  if (!isAdmin) {
    const error = new Error("No tienes permisos de administrador para realizar esta acción");
    console.error(error.message);
    return { success: false, error };
  }

  // Realizar el soft delete del reporte (sin restricción de usuario_id)
  const { error } = await supabase
    .from("reportes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reporteId);

  if (error) {
    console.error("Error al eliminar reporte:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
