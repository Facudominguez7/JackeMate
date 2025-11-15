import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Determina si un usuario puede ver el panel de analíticas.
 *
 * Un usuario puede ver el panel si tiene rol Admin (rol_id = 1) o Interesado (rol_id = 3).
 *
 * @param usuarioId - ID del usuario a verificar
 * @returns Objeto con `puedeVerDashboard`: `true` si el usuario puede ver el panel, `false` en caso contrario; y `error`: el error ocurrido o `null`
 */
export async function verificarPuedeVerDashboard(
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
    return { puedeVerDashboard: false, error };
  }

  // El usuario puede ver el dashboard si es Admin (1) o Interesado (3)
  const puedeVerDashboard = data?.rol_id === 1 || data?.rol_id === 3;

  return { puedeVerDashboard, error: null };
}

/**
 * Wrapper en desuso que verifica si un usuario puede ver el dashboard y devuelve el resultado con la propiedad `isInteresado`.
 *
 * @deprecated Usar `verificarPuedeVerDashboard` en su lugar.
 * @param usuarioId - Identificador del usuario a comprobar.
 * @returns Un objeto con `isInteresado` igual a `true` si el usuario puede ver el dashboard, `false` en caso contrario; y `error` con el error original o `null`.
 */
export async function verificarEsInteresado(
  supabase: SupabaseClient,
  usuarioId: string
) {
  return verificarPuedeVerDashboard(supabase, usuarioId).then(result => ({
    isInteresado: result.puedeVerDashboard,
    error: result.error
  }));
}