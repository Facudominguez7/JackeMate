import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Determina si un usuario puede crear reportes.
 *
 * Un usuario puede crear reportes solo si tiene rol Admin (rol_id = 1) o Ciudadano (rol_id = 2).
 * Los usuarios con rol Interesado (rol_id = 3) NO pueden crear reportes.
 *
 * @param supabase - Cliente de Supabase
 * @param usuarioId - ID del usuario a verificar
 * @returns Objeto con `puedeCrear`: `true` si el usuario puede crear reportes, `false` en caso contrario; 
 *          `rolId`: el ID del rol del usuario; y `error`: el error ocurrido o `null`
 */
export async function verificarPuedeCrearReporte(
  supabase: SupabaseClient,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("rol_id, roles (nombre)")
    .eq("id", usuarioId)
    .single();

  if (error) {
    console.error("Error al verificar rol de usuario:", error);
    return { puedeCrear: false, rolId: null, error };
  }

  // El usuario puede crear reportes si es Admin (1) o Ciudadano (2)
  // Los Interesados (3) NO pueden crear reportes
  const puedeCrear = data?.rol_id === 1 || data?.rol_id === 2;

  return { puedeCrear, rolId: data?.rol_id, error: null };
}
