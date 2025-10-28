import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene el conteo de votos "no existe" para un reporte
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
 * Verifica si un usuario ya votó "no existe" en un reporte
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
 * Registra un voto "no existe" de un usuario
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

  return { success: true, error: null };
}

/**
 * Obtiene el ID del estado "Rechazado"
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
 * Actualiza el estado de un reporte
 */
export async function actualizarEstadoReporte(
  supabase: SupabaseClient,
  reporteId: number,
  estadoId: number
) {
  const { error } = await supabase
    .from("reportes")
    .update({ estado_id: estadoId })
    .eq("id", reporteId);

  if (error) {
    console.error("Error al actualizar estado:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
