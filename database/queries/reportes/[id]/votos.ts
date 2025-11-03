import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, actualizarPuntos, PUNTOS } from "@/database/queries/puntos";

/**
 * Consulta el número de votos "no existe" asociados a un reporte.
 *
 * @param reporteId - ID del reporte cuyo conteo de votos se desea obtener
 * @returns Un objeto con `count` — número de votos "no existe" para el reporte (0 si no hay o en caso de error) y `error` — el error ocurrido o `null`
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
 * Comprueba si un usuario ya ha votado "no existe" en un reporte.
 *
 * @param reporteId - ID del reporte a comprobar
 * @param usuarioId - ID del usuario que se consulta
 * @returns Un objeto con `hasVoted`: `true` si el usuario ya votó "no existe" en el reporte, `false` en caso contrario; y `error`: el error ocurrido o `null` si no hubo error
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
 * Registra un voto "no existe" para un reporte y aplica los puntos correspondientes al votante.
 *
 * @param reporteId - Identificador numérico del reporte que recibe el voto
 * @param usuarioId - Identificador del usuario que emite el voto
 * @returns Un objeto con `success` indicando si la operación principal fue exitosa y `error` con el error ocurrido (si lo hubo). `success` es `true` cuando el voto se insertó y se intentaron sumar puntos; `false` y `error` cuando falló la inserción del voto.
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
 * Obtiene el ID del estado llamado "Rechazado".
 *
 * @returns El objeto con `estadoId` (el ID si existe, `null` en caso contrario) y `error` (`null` si la consulta tuvo éxito)
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
 * Actualiza el estado de un reporte, ajusta puntos según la transición y registra el cambio en el historial.
 *
 * @param reporteId - ID del reporte cuyo estado se actualizará
 * @param estadoId - ID del nuevo estado que se asignará al reporte
 * @param estadoAnteriorId - ID del estado previo, si está disponible
 * @param usuarioId - ID del usuario que realiza el cambio, si corresponde
 * @param comentario - Comentario opcional asociado al cambio de estado
 * @returns Un objeto con `success`: `true` si la actualización del estado se realizó (aunque el registro en historial pueda fallar), `false` en caso de error; `error` contiene el detalle del fallo o `null`
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