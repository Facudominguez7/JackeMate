import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Constantes de puntos para el sistema de gamificación
 */
export const PUNTOS = {
  CREAR_REPORTE: 10,
  COMENTAR_REPORTE: 2,
  VOTAR_NO_EXISTE: 1,
  VOTAR_REPARADO: 1,
  REPORTE_VALIDADO_REPARADO: 5, // Bonus si tu reporte llega a "Reparado"
  REPORTE_RECHAZADO: -3, // Penalización si tu reporte es rechazado
  ELIMINAR_REPORTE_PROPIO: -10, // Resta los puntos ganados
} as const;

/**
 * Atomically adjusts a user's points total in the "profiles" table, ensuring it never goes below zero.
 *
 * @param supabase - Supabase client used to read and update the profile row
 * @param usuarioId - ID of the user whose points will be adjusted
 * @param puntos - Number of points to add (positive) or subtract (negative)
 * @param razon - Optional short reason logged for the change
 * @returns An object with `success: true` when the update completed, or `success: false` and an `error` value when it failed
 */
export async function actualizarPuntos(
  supabase: SupabaseClient,
  usuarioId: string,
  puntos: number,
  razon?: string
) {
  try {
    // Primero obtenemos los puntos actuales
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("puntos")
      .eq("id", usuarioId)
      .single();

    if (fetchError || !profile) {
      console.error("Error al obtener perfil:", fetchError);
      return { success: false, error: fetchError };
    }

    // Calculamos los nuevos puntos asegurándonos que no sean negativos
    const nuevosPuntos = Math.max(0, (profile.puntos || 0) + puntos);

    // Actualizamos con el nuevo valor
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ puntos: nuevosPuntos })
      .eq("id", usuarioId);

    if (updateError) {
      console.error("Error al actualizar puntos:", updateError);
      return { success: false, error: updateError };
    }

    // Log opcional para debugging
    if (razon) {
      console.log(`[PUNTOS] Usuario ${usuarioId}: ${puntos > 0 ? '+' : ''}${puntos} puntos (Total: ${nuevosPuntos}) - ${razon}`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error inesperado al actualizar puntos:", error);
    return { success: false, error };
  }
}

/**
 * Fetches the current points for a user from the "profiles" table.
 *
 * @param usuarioId - The user's id to look up
 * @returns An object with `puntos` set to the user's points (0 if not found) and `error` set to the error object when the query fails, or `null` on success
 */
export async function getPuntosUsuario(
  supabase: SupabaseClient,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("puntos")
    .eq("id", usuarioId)
    .single();

  if (error) {
    console.error("Error al obtener puntos del usuario:", error);
    return { puntos: 0, error };
  }

  return { puntos: data?.puntos || 0, error: null };
}

/**
 * Retrieve the top users ordered by points in descending order.
 *
 * @param limite - Maximum number of users to return (default: 3)
 * @returns An object with `data` — an array of user records (`id`, `username`, `puntos`) ordered by points descending; and `error` — the query error if one occurred, or `null` on success.
 */
export async function getTopUsuarios(
  supabase: SupabaseClient,
  limite: number = 3
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, puntos")
    .order("puntos", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("Error al obtener top usuarios:", error);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

/**
 * Add points to a user's account using the absolute value of `puntos`.
 *
 * @param puntos - Number of points to add; negative values are converted to their absolute value.
 * @param razon - Optional reason recorded in debug logs for the points change.
 * @returns An object with `success` set to `true` on success and `error` containing any error information or `null`.
 */
export async function sumarPuntos(
  supabase: SupabaseClient,
  usuarioId: string,
  puntos: number,
  razon?: string
) {
  return actualizarPuntos(supabase, usuarioId, Math.abs(puntos), razon);
}

/**
 * Subtracts a given number of points from the specified user's total.
 *
 * @param usuarioId - ID of the user whose points will be decreased
 * @param puntos - Number of points to subtract (positive values will be applied as subtraction)
 * @param razon - Optional reason for the points change, used for logging/debugging
 * @returns `{ success: true, error: null }` if the update succeeded, `{ success: false, error }` if it failed
 */
export async function restarPuntos(
  supabase: SupabaseClient,
  usuarioId: string,
  puntos: number,
  razon?: string
) {
  return actualizarPuntos(supabase, usuarioId, -Math.abs(puntos), razon);
}