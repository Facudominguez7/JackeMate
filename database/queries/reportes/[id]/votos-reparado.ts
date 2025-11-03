import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Obtiene el número de votos "Reparado" para un reporte dado.
 *
 * @returns `count` con el número de votos; `error` con el error ocurrido o `null` si no hubo error.
 */
export async function getVotosReparado(supabase: SupabaseClient, reporteId: string) {
  const { count, error } = await supabase
    .from("votos_reparado")
    .select("*", { count: "exact", head: true })
    .eq("reporte_id", reporteId);

  if (error) {
    console.error("Error al obtener votos reparado:", error);
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
}

/**
 * Determina si un usuario ya ha votado "Reparado" en un reporte.
 *
 * @returns Un objeto con `hasVoted`: `true` si existe un voto del usuario para el reporte, `false` en caso contrario; `error`: el error ocurrido o `null` si la operación fue exitosa.
 */
export async function verificarVotoReparadoUsuario(
  supabase: SupabaseClient,
  reporteId: string,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from("votos_reparado")
    .select("id")
    .eq("reporte_id", reporteId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) {
    console.error("Error al verificar voto reparado:", error);
    return { hasVoted: false, error };
  }

  return { hasVoted: !!data, error: null };
}

/**
 * Registra un voto "Reparado" para un reporte por un usuario.
 *
 * @param reporteId - Id del reporte que recibe el voto
 * @param usuarioId - Id del usuario que emite el voto
 * @returns Objeto con `success` y `error`: `success` es `true` si el voto se insertó y se asignaron puntos al usuario, `false` en caso de error; `error` contiene el error ocurrido o `null`
 */
export async function votarReparado(
  supabase: SupabaseClient,
  reporteId: number,
  usuarioId: string
) {
  const { error } = await supabase.from("votos_reparado").insert({
    reporte_id: reporteId,
    usuario_id: usuarioId,
  });

  if (error) {
    console.error("Error al registrar voto reparado:", error);
    return { success: false, error };
  }

  // Sumar puntos por votar
  await sumarPuntos(
    supabase,
    usuarioId,
    PUNTOS.VOTAR_REPARADO,
    "Votar 'Reparado' en reporte"
  );

  return { success: true, error: null };
}

/**
 * Devuelve el identificador del estado llamado "Reparado".
 *
 * @returns Un objeto con `estadoId` —el id del estado "Reparado" o `null` si no existe— y `error` —el error ocurrido o `null` si la consulta tuvo éxito.
 */
export async function getEstadoReparadoId(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("estados")
    .select("id")
    .eq("nombre", "Reparado")
    .single();

  if (error) {
    console.error("Error al obtener estado reparado:", error);
    return { estadoId: null, error };
  }

  return { estadoId: data?.id || null, error: null };
}