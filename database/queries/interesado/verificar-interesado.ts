import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifica si un usuario puede ver el dashboard de analíticas.
 * 
 * Un usuario puede ver el dashboard si es Admin (rol_id = 1) o Interesado (rol_id = 3).
 * 
 * @param supabase - Cliente de Supabase
 * @param usuarioId - ID del usuario a verificar
 * @returns Un objeto con `puedeVerDashboard` (boolean) y `error` (null o el error ocurrido)
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
 * @deprecated Usar verificarPuedeVerDashboard en su lugar
 * Mantiene compatibilidad con código existente
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
