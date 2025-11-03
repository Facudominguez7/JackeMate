import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, actualizarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Get the count of "no existe" votes for a specific report.
 *
 * @param reporteId - The report's ID to count "no existe" votes for
 * @returns An object with `count` — the exact number of "no existe" votes (0 if none), and `error` — a Supabase error object or `null`
 */
export async function getVotosNoExiste(supabase: SupabaseClient, reporteId: string) {
  const { count, error } = await supabase
    .from("votos_no_existe")
    .select("*", { count: "exact", head: true })
    .eq("reporte_id", reporteId);

  if (error) {
    console.error("Error al obtener votos:", error);
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
}

/**
 * Determines whether a user has cast a "no existe" vote on a specific report.
 *
 * @returns `hasVoted` is `true` if a matching vote exists, `false` otherwise; `error` contains the Supabase error when the check fails, otherwise `null`.
 */
export async function verificarVotoUsuario(
  supabase: SupabaseClient,
  reporteId: string,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from("votos_no_existe")
    .select("id")
    .eq("reporte_id", reporteId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) {
    console.error("Error al verificar voto:", error);
    return { hasVoted: false, error };
  }

  return { hasVoted: !!data, error: null };
}

/**
 * Record a user's "no existe" vote for a report.
 *
 * @param supabase - Supabase client used to perform the database operations
 * @param reporteId - ID of the report to which the vote applies
 * @param usuarioId - ID of the user casting the vote
 * @returns `{ success: true, error: null }` when the vote and points award succeed, `{ success: false, error }` if the database insert fails
 */
export async function votarNoExiste(
  supabase: SupabaseClient,
  reporteId: number,
  usuarioId: string
) {
  const { error } = await supabase.from("votos_no_existe").insert({
    reporte_id: reporteId,
    usuario_id: usuarioId,
  });

  if (error) {
    console.error("Error al registrar voto:", error);
    return { success: false, error };
  }

  // Sumar puntos por votar
  await sumarPuntos(
    supabase,
    usuarioId,
    PUNTOS.VOTAR_NO_EXISTE,
    "Votar 'No Existe' en reporte"
  );

  return { success: true, error: null };
}

/**
 * Fetches the ID of the "Rechazado" state.
 *
 * @returns An object with `estadoId` set to the state's numeric ID or `null` if not found, and `error` set to `null` on success or the error object if the query failed.
 */
export async function getEstadoRechazadoId(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("estados")
    .select("id")
    .eq("nombre", "Rechazado")
    .single();

  if (error) {
    console.error("Error al obtener estado rechazado:", error);
    return { estadoId: null, error };
  }

  return { estadoId: data?.id || null, error: null };
}

/**
 * Update a report's state, award/penalize points for the report owner when applicable, and record the change in the state history.
 *
 * Updates the `estado_id` of the specified report, applies point adjustments to the report creator when the new state is "rechazado" (penalty) or "reparado" (reward), and inserts a record into `historial_estados`. If recording the history fails the function still returns success as long as the state update completed.
 *
 * @param reporteId - ID of the report to update
 * @param estadoId - ID of the new state to set on the report
 * @param estadoAnteriorId - Optional ID of the previous state to store in history
 * @param usuarioId - Optional ID of the user performing the state change to store in history
 * @param comentario - Optional comment to store with the history entry
 * @returns An object with `success` set to `true` when the report state was updated, or `false` and an `error` containing the Supabase error when the update or initial report lookup failed; `error` is `null` on success.
 */
export async function actualizarEstadoReporte(
  supabase: SupabaseClient,
  reporteId: number,
  estadoId: number,
  estadoAnteriorId?: number,
  usuarioId?: string,
  comentario?: string
) {
  // Obtener el reporte para saber quién es el creador
  const { data: reporte, error: reporteError } = await supabase
    .from("reportes")
    .select("usuario_id")
    .eq("id", reporteId)
    .single();

  if (reporteError) {
    console.error("Error al obtener reporte:", reporteError);
    return { success: false, error: reporteError };
  }

  // Actualizar el estado del reporte
  const { error } = await supabase
    .from("reportes")
    .update({ estado_id: estadoId })
    .eq("id", reporteId);

  if (error) {
    console.error("Error al actualizar estado:", error);
    return { success: false, error };
  }

  // Obtener el nombre del nuevo estado
  const { data: estadoData } = await supabase
    .from("estados")
    .select("nombre")
    .eq("id", estadoId)
    .single();

  const estadoNombre = estadoData?.nombre?.toLowerCase();

  // Aplicar puntos según el nuevo estado
  if (estadoNombre === "rechazado" && reporte.usuario_id) {
    // Penalizar al creador si su reporte fue rechazado
    await actualizarPuntos(
      supabase,
      reporte.usuario_id,
      PUNTOS.REPORTE_RECHAZADO,
      "Reporte rechazado por votos"
    );
  } else if (estadoNombre === "reparado" && reporte.usuario_id) {
    // Bonus al creador si su reporte fue reparado
    await sumarPuntos(
      supabase,
      reporte.usuario_id,
      PUNTOS.REPORTE_VALIDADO_REPARADO,
      "Reporte validado como reparado"
    );
  }

  // Registrar en el historial
  const { error: historialError } = await supabase.from("historial_estados").insert({
    reporte_id: reporteId,
    estado_anterior_id: estadoAnteriorId || null,
    estado_nuevo_id: estadoId,
    usuario_id: usuarioId || null,
    comentario: comentario || null,
  });

  if (historialError) {
    console.error("Error al registrar historial:", historialError);
    // No retornamos error aquí porque el estado sí se actualizó
  }

  return { success: true, error: null };
}