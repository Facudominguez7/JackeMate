import { SupabaseClient } from "@supabase/supabase-js";
import { verificarEsAdmin } from "./verificar-admin";

/**
 * Elimina un comentario (soft delete). Solo usuarios con rol admin pueden ejecutar esta acción.
 * 
 * A diferencia de la función eliminarComentario normal, esta permite al admin eliminar
 * cualquier comentario, no solo los propios.
 * 
 * @param supabase - Cliente de Supabase
 * @param comentarioId - ID del comentario a eliminar
 * @param usuarioId - ID del usuario admin que realiza la eliminación
 * @returns Un objeto con `success` (boolean) y `error` (null o el error ocurrido)
 */
export async function eliminarComentarioAdmin(
  supabase: SupabaseClient,
  comentarioId: number,
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

  // Realizar el soft delete del comentario (sin restricción de usuario_id)
  const { error } = await supabase
    .from("comentarios_reporte")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", comentarioId);

  if (error) {
    console.error("Error al eliminar comentario:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
