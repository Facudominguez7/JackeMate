import { SupabaseClient } from "@supabase/supabase-js";
import { verificarEsAdmin } from "./verificar-admin";

/**
 * Marca como eliminado un comentario por su ID; solo usuarios con rol de administrador pueden ejecutar la acción.
 *
 * @param supabase - Cliente de Supabase usado para realizar la operación en la base de datos
 * @param comentarioId - ID del comentario a marcar como eliminado
 * @param usuarioId - ID del usuario que realiza la acción (debe ser administrador)
 * @returns `success` es `true` si la operación se completó correctamente, `false` en caso contrario; `error` contiene el `Error` ocurrido o `null`
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