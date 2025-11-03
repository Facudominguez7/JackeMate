import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Record a report's status change in the status history table.
 *
 * @param reporteId - ID of the report whose status changed
 * @param estadoAnteriorId - ID of the previous status, or `null` if none
 * @param estadoNuevoId - ID of the new status
 * @param usuarioId - Optional ID of the user who made the change; stored as `null` when not provided
 * @param comentario - Optional comment associated with the change; stored as `null` when not provided
 * @returns An object with `success: true` and `error: null` on success, or `success: false` and `error` containing the insertion error on failure
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
 * Retrieve a report's status history for timeline display.
 *
 * @param reporteId - The report identifier to fetch history for.
 * @returns An object containing `data` — an array of history records (empty array on error) and `error` — the error object when the query fails, or `null` on success.
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