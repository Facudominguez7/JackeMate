import { SupabaseClient } from "@supabase/supabase-js";

import { isAdminRole } from "@/lib/authz/roles";

/**
 * Determina si un usuario tiene permisos de administrador.
 *
 * Un usuario se considera administrador cuando su `rol_id` es 1.
 *
 * @param usuarioId - ID del usuario a verificar
 * @returns Objeto con `isAdmin`: `true` si el usuario tiene rol de administrador (`rol_id === 1`), `false` en caso contrario; `error`: `null` si la consulta fue exitosa o el error ocurrido en caso contrario
 */
export async function verificarEsAdmin(
  supabase: SupabaseClient,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("rol_id")
    .eq("id", usuarioId)
    .single();

  if (error) {
    console.error("Error al verificar rol de admin:", error);
    return { isAdmin: false, error };
  }

  // El usuario es admin si su rol_id es 1 (rol "Admin")
  const isAdmin = isAdminRole(data?.rol_id);

  return { isAdmin, error: null };
}
