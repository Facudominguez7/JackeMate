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
 * Ajusta el saldo de puntos de un usuario en la tabla `profiles`, garantizando que el total no sea menor que cero.
 *
 * @param usuarioId - Identificador del usuario cuyo saldo se ajusta
 * @param puntos - Cantidad a aplicar: valores positivos suman puntos, valores negativos restan
 * @param razon - Texto opcional para registrar el motivo del cambio
 * @returns `{ success: true, error: null }` si la operación fue exitosa; `{ success: false, error }` si ocurrió un error
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
 * Obtiene los puntos actuales de un usuario.
 *
 * @param usuarioId - Identificador del perfil del usuario cuya puntuación se consulta.
 * @returns Un objeto con `puntos` (número; 0 si no existe o en caso de error) y `error` (el error ocurrido, o `null` si la operación fue correcta)
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
 * Devuelve el top de usuarios ordenados por puntos.
 *
 * @param limite - Número máximo de usuarios a devolver (por defecto 3)
 * @returns Un objeto con `data`: array de usuarios (`{ id, username, puntos }`) y `error`: `null` si la consulta tuvo éxito o el error devuelto por la consulta
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
 * Añade puntos al total de un usuario.
 *
 * @param usuarioId - Identificador del usuario cuyos puntos se actualizarán
 * @param puntos - Cantidad de puntos a sumar (se normaliza a valor positivo)
 * @param razon - Motivo opcional usado para registro informativo del cambio
 * @returns Objeto con `success: true` si la operación tuvo éxito, `success: false` y `error` en caso contrario
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
 * Resta una cantidad de puntos al perfil de un usuario.
 *
 * @returns `{ success: true, error: null }` si la operación tuvo éxito, `{ success: false, error }` en caso contrario.
 */
export async function restarPuntos(
  supabase: SupabaseClient,
  usuarioId: string,
  puntos: number,
  razon?: string
) {
  return actualizarPuntos(supabase, usuarioId, -Math.abs(puntos), razon);
}