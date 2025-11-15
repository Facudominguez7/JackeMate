import { SupabaseClient } from "@supabase/supabase-js";
import { verificarEsAdmin } from "./verificar-admin";

/**
 * Realiza un borrado suave (soft delete) de un reporte, acción restringida a administradores.
 *
 * Un administrador puede eliminar cualquier reporte sin comprobar la propiedad del mismo.
 *
 * @param reporteId - ID del reporte a eliminar
 * @param usuarioId - ID del usuario que realiza la acción (debe ser administrador)
 * @returns Un objeto con `success` igual a `true` si la eliminación se realizó correctamente; `success` igual a `false` y `error` con el error ocurrido en caso contrario
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