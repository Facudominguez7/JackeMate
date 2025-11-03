import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, actualizarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Get the count of "no existe" votes for a report.
 *
 * @param reporteId - The ID of the report to count votes for
 * @returns An object with `count` set to the number of "no existe" votes (0 if none) and `error` set to the error object or `null`
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
 * Check whether a user has already voted "no existe" on a report.
 *
 * @param reporteId - The ID of the report to check
 * @param usuarioId - The ID of the user to check
 * @returns An object with `hasVoted`: `true` if the user has a "no existe" vote for the report, `false` otherwise; and `error`: the query error object if the operation failed, or `null` when successful
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
 * Register a user's "no existe" vote for a report.
 *
 * Also awards the voter points for casting the vote.
 *
 * @param reporteId - ID of the report receiving the vote
 * @param usuarioId - ID of the user casting the vote
 * @returns An object with `success: true` and `error: null` on success; `success: false` and `error` on failure
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
 * Retrieve the ID of the "Rechazado" state.
 *
 * @returns The `id` of the "Rechazado" state, or `null` if not found or on error; `error` contains the underlying error when present.
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
 * Update a report's state, record the state change in history, and adjust the report creator's points when applicable.
 *
 * Updates the report's `estado_id`, inserts a row into `historial_estados` describing the transition, and
 * applies point adjustments to the report's creator when the new state is "rechazado" (penalty) or "reparado" (reward).
 *
 * @param reporteId - ID of the report to update
 * @param estadoId - ID of the new state to set on the report
 * @param estadoAnteriorId - Optional ID of the previous state to record in history
 * @param usuarioId - Optional ID of the user who performed the state change (stored in history)
 * @param comentario - Optional comment describing the reason for the state change (stored in history)
 * @returns An object with `success: true` when the state update completed; `error` contains any fatal error encountered, or `null` on success
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