import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Fetches the exact number of "Reparado" votes for a report.
 *
 * @returns An object with `count`: the number of "Reparado" votes for the report (0 if none), and `error`: the database error object if the query failed, or `null` on success.
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
 * Checks whether a user has already voted "reparado" on a report.
 *
 * @returns An object with `hasVoted`: `true` if the user has a "reparado" vote for the report, `false` otherwise; and `error`: the database error if the query failed, or `null` on success.
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
 * Record a user's "Reparado" vote for a report and award the corresponding points.
 *
 * @param reporteId - The numeric ID of the report to vote on
 * @param usuarioId - The ID of the user casting the vote
 * @returns An object with `success` set to `true` if the vote was recorded and points awarded, `false` otherwise; `error` contains the original error when `success` is `false`, `null` on success
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
 * Retrieve the ID of the estado named "Reparado".
 *
 * @returns An object with `estadoId` set to the estado's ID or `null` if not found, and `error` set to the error object when an error occurred or `null` otherwise.
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