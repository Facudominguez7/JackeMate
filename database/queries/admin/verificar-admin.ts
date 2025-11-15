import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifica si un usuario tiene permisos de administrador.
 * 
 * Un usuario es considerado admin si su rol_id es 1 (rol "Admin").
 * 
 * @param supabase - Cliente de Supabase
 * @param usuarioId - ID del usuario a verificar
 * @returns Un objeto con `isAdmin` (boolean) y `error` (null o el error ocurrido)
 */
export async function verificarEsAdmin(
  supabase: SupabaseClient,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("rol_id, roles (nombre)")
    .eq("id", usuarioId)
    .single();

  if (error) {
    console.error("Error al verificar rol de admin:", error);
    return { isAdmin: false, error };
  }

  // El usuario es admin si su rol_id es 1 (rol "Admin")
  const isAdmin = data?.rol_id === 1;

  return { isAdmin, error: null };
}
