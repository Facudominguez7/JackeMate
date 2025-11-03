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
 * Adjusts a user's points in the profiles table, ensuring the total never goes below zero.
 *
 * @param usuarioId - The ID of the user whose points will be adjusted
 * @param puntos - Positive to add points, negative to subtract points
 * @param razon - Optional short description of why the points changed (used for logging)
 * @returns `{ success: true, error: null }` on successful update; `{ success: false, error }` if the operation failed
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
 * Fetches a user's current points from the profiles table.
 *
 * @returns An object with `puntos` — the user's points (0 if the profile is not found or the value is missing) and `error` — the Supabase error object when the query failed, or `null` on success.
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
 * Retrieve the top N users ordered by their points.
 *
 * @param limite - Maximum number of users to return (defaults to 3)
 * @returns An object with `data` as an array of user objects (`id`, `username`, `puntos`) and `error` set to `null` on success, or `error` populated and `data` as an empty array on failure
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
 * Add points to a user's profile.
 *
 * @param puntos - Number of points to add; the absolute value is applied.
 * @param razon - Optional reason recorded for the point change (used for logging/debugging).
 * @returns An object with `success: true` and `error: null` on success, or `success: false` and an `error` on failure.
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
 * Subtracts points from a user's total.
 *
 * @param razon - Optional human-readable reason for the point deduction
 * @returns An object with `success: true` when the update succeeds, or `success: false` and `error` containing details when it fails
 */
export async function restarPuntos(
  supabase: SupabaseClient,
  usuarioId: string,
  puntos: number,
  razon?: string
) {
  return actualizarPuntos(supabase, usuarioId, -Math.abs(puntos), razon);
}