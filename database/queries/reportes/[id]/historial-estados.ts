import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Registra un cambio de estado en el historial
 * Se usa cada vez que un reporte cambia de estado
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
 * Obtiene el historial de estados de un reporte
 * Útil para mostrar la línea de tiempo de cambios
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
