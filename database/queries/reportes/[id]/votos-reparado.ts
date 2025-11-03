import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Get the count of "reparado" votes for a report.
 *
 * @param reporteId - The ID of the report to count "reparado" votes for
 * @returns An object with `count` set to the number of "reparado" votes and `error` set to the query error if one occurred, or `null` on success
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
 * Determines whether a user has already voted "reparado" on a report.
 *
 * @param reporteId - ID of the report to check
 * @param usuarioId - ID of the user to check
 * @returns An object with `hasVoted` set to `true` if a matching vote exists, `false` otherwise, and `error` containing the database error or `null`
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
 * Records a user's "reparado" vote for a report.
 *
 * @returns An object with `success`: `true` if the vote was recorded, `false` otherwise; `error`: the database error when the operation failed, or `null` on success.
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
 * Retrieve the database ID of the "Reparado" state.
 *
 * @returns An object with `estadoId` set to the state's `id` if found or `null` otherwise, and `error` set to the encountered error or `null`.
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