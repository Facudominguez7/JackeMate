import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Record a report's state change in the historial_estados table.
 *
 * Inserts a history entry linking the report to its previous and new state, optionally including the user and a comment.
 *
 * @param reporteId - Identifier of the report whose state changed
 * @param estadoAnteriorId - Previous state id, or `null` when there was no prior state
 * @param estadoNuevoId - New state id being recorded
 * @param usuarioId - Optional user id responsible for the change
 * @param comentario - Optional comment describing the change
 * @returns An object with `success: true` and `error: null` on success; `success: false` and the `error` object on failure
 */
export async function registrarCambioEstado(
  supabase: SupabaseClient,
  reporteId: number,
  estadoAnteriorId: number | null,
  estadoNuevoId: number,
  usuarioId?: string,
  comentario?: string
) {
  const { error } = await supabase.from("historial_estados").insert({
    reporte_id: reporteId,
    estado_anterior_id: estadoAnteriorId,
    estado_nuevo_id: estadoNuevoId,
    usuario_id: usuarioId || null,
    comentario: comentario || null,
  });

  if (error) {
    console.error("Error al registrar cambio de estado:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

/**
 * Fetches the state-change history for a report, ordered by newest first.
 *
 * Each returned entry contains the historial_estados fields plus joined
 * `estado_anterior` (id, nombre), `estado_nuevo` (id, nombre), and `usuario` (username).
 *
 * @param reporteId - The report identifier to filter history by.
 * @returns An object with `data` (an array of history entries ordered by `created_at` descending)
 *          and `error` (the error object if the query failed, otherwise `null`). When a query error occurs,
 *          `data` will be an empty array and `error` will contain the error details.
 */
export async function getHistorialEstados(
  supabase: SupabaseClient,
  reporteId: string
) {
  const { data, error } = await supabase
    .from("historial_estados")
    .select(`
      *,
      estado_anterior:estados!historial_estados_estado_anterior_id_fkey(id, nombre),
      estado_nuevo:estados!historial_estados_estado_nuevo_id_fkey(id, nombre),
      usuario:profiles(username)
    `)
    .eq("reporte_id", reporteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener historial de estados:", error);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}