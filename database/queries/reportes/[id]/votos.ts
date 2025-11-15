import { SupabaseClient } from "@supabase/supabase-js";
import { sumarPuntos, actualizarPuntos, PUNTOS } from "@/database/queries/puntos";
import { getUserEmail } from "./get-owner-email";

// ============================================
// FUNCIONES DE VOTOS "NO EXISTE"
// ============================================

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
    console.error("Error al obtener votos no existe:", error);
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
}

/**
 * Comprueba si un usuario ha votado "no existe" en un reporte.
 *
 * @param reporteId - ID del reporte a comprobar
 * @param usuarioId - ID del usuario a comprobar
 * @returns Objeto con `hasVoted`: `true` si el usuario ya votó "no existe" para el reporte, `false` en caso contrario; y `error`: el error ocurrido o `null` si no hubo error
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
    console.error("Error al verificar voto no existe:", error);
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
    console.error("Error al registrar voto no existe:", error);
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

// ============================================
// FUNCIONES DE VOTOS "REPARADO"
// ============================================

/**
 * Obtiene el número de votos "Reparado" para un reporte dado.
 *
 * @param reporteId - ID del reporte cuyo conteo de votos se desea obtener
 * @returns `count` con el número de votos; `error` con el error ocurrido o `null` si no hubo error.
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
 * Determina si un usuario ya ha votado "Reparado" en un reporte.
 *
 * @param reporteId - ID del reporte a comprobar
 * @param usuarioId - ID del usuario que se consulta
 * @returns Un objeto con `hasVoted`: `true` si existe un voto del usuario para el reporte, `false` en caso contrario; `error`: el error ocurrido o `null` si la operación fue exitosa.
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
 * Registra un voto "Reparado" para un reporte por un usuario.
 *
 * @param reporteId - Id del reporte que recibe el voto
 * @param usuarioId - Id del usuario que emite el voto
 * @returns Objeto con `success` y `error`: `success` es `true` si el voto se insertó y se asignaron puntos al usuario, `false` en caso de error; `error` contiene el error ocurrido o `null`
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

// ============================================
// FUNCIONES DE ESTADOS
// ============================================

/**
 * Obtiene el ID del estado "Rechazado".
 * ID según base de datos: 3
 *
 * @returns El objeto con `estadoId` (siempre 3 para Rechazado) y `error` (null)
 */
export async function getEstadoRechazadoId(supabase: SupabaseClient) {
  // ID fijo según la base de datos
  return { estadoId: 3, error: null };
}

/**
 * Obtiene el identificador del estado "Reparado".
 *
 * Devuelve el valor fijo usado para representar el estado "Reparado" en la base de datos.
 *
 * @returns Un objeto con `estadoId` igual a 2 y `error` siempre `null`.
 */
export async function getEstadoReparadoId(supabase: SupabaseClient) {
  // ID fijo según la base de datos
  return { estadoId: 2, error: null };
}

/**
 * Actualiza el estado de un reporte, ajusta puntos según la transición, registra el cambio en el historial y notifica al propietario cuando procede.
 *
 * Actualiza la columna `estado_id` del reporte indicado; aplica penalización o bonificación de puntos al autor si el nuevo estado es `Rechazado` (3) o `Reparado` (2) respectivamente; inserta un registro en `historial_estados` (si el registro de historial falla se registra en consola pero no invalida la operación principal); y, si procede, intenta enviar una notificación por correo al propietario con el nuevo estado y el comentario (fallos en la notificación se registran pero no provocan error de la operación).
 *
 * @param reporteId - ID del reporte cuyo estado se actualizará
 * @param estadoId - ID del nuevo estado que se asignará al reporte (2 = Reparado, 3 = Rechazado)
 * @param estadoAnteriorId - ID del estado previo, si está disponible
 * @param usuarioId - ID del usuario que realiza el cambio, si corresponde
 * @param comentario - Comentario opcional asociado al cambio de estado
 * @returns Un objeto con `success`: `true` si la actualización del estado se realizó; `error` contiene el detalle del fallo o `null` (la función devuelve `success: true` aunque fallen el registro en historial o el envío de notificación)
 */
export async function actualizarEstadoReporte(
  supabase: SupabaseClient,
  reporteId: number,
  estadoId: number,
  estadoAnteriorId?: number,
  usuarioId?: string,
  comentario?: string
) {
  // Obtener el reporte completo con toda la información necesaria
  const { data: reporte, error: reporteError } = await supabase
    .from("reportes")
    .select(`
      usuario_id,
      titulo,
      profiles (username)
    `)
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

  // IDs de estados según la base de datos: 1 = Pendiente, 2 = Reparado, 3 = Rechazado
  const ESTADO_REPARADO = 2;
  const ESTADO_RECHAZADO = 3;

  // Aplicar puntos según el nuevo estado (usando IDs directos)
  if (estadoId === ESTADO_RECHAZADO && reporte.usuario_id) {
    // Penalizar al creador si su reporte fue rechazado
    await actualizarPuntos(
      supabase,
      reporte.usuario_id,
      PUNTOS.REPORTE_RECHAZADO,
      "Reporte rechazado por votos"
    );
  } else if (estadoId === ESTADO_REPARADO && reporte.usuario_id) {
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

  // Enviar notificación por correo si el estado cambió a Reparado (2) o Rechazado (3)
  if ((estadoId === ESTADO_REPARADO || estadoId === ESTADO_RECHAZADO) && reporte.usuario_id) {
    try {
      // Determinar el nombre del estado para el correo
      const estadoNombre = estadoId === ESTADO_REPARADO ? "Reparado" : "Rechazado";

      // Obtener el email del dueño del reporte usando la query directa
      const { data: email } = await getUserEmail(supabase, reporte.usuario_id);

      if (email) {
        const profiles: any = reporte.profiles;
        const username = Array.isArray(profiles) 
          ? profiles[0]?.username || "Usuario"
          : profiles?.username || "Usuario";

        // Enviar la notificación de cambio de estado
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-status-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerEmail: email,
            ownerUsername: username,
            reporteId: reporteId,
            reporteTitulo: reporte.titulo,
            nuevoEstado: estadoNombre,
            comentario: comentario || null,
          }),
        });

        console.log(`Notificación de cambio de estado enviada para reporte ${reporteId}`);
      }
    } catch (notifError) {
      // No fallar si la notificación no se envía, solo loguearlo
      console.error("Error al enviar notificación de cambio de estado:", notifError);
    }
  }

  return { success: true, error: null };
}