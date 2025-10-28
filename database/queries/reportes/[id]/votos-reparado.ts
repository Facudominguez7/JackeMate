import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene el conteo de votos "reparado" para un reporte
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
 * Verifica si un usuario ya votó "reparado" en un reporte
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
 * Registra un voto "reparado" de un usuario
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

  return { success: true, error: null };
}

/**
 * Obtiene el ID del estado "Reparado"
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
