import { SupabaseClient } from "@supabase/supabase-js";
import { verificarEsAdmin } from "./verificar-admin";
import { actualizarEstadoReporte } from "@/database/queries/reportes/[id]/votos";

/**
 * Cambia el estado de un reporte, restringido a usuarios con rol de administrador.
 *
 * @param usuarioId - ID del usuario que realiza el cambio; debe tener rol de administrador
 * @param comentario - Comentario opcional sobre el cambio; si no se proporciona se usa `"Cambio de estado realizado por administrador"`
 * @returns Objeto con `success` y `error`: `success` es `true` si la actualización se realizó, `false` en caso contrario; `error` contiene el error ocurrido o `null`
 */
export async function cambiarEstadoReporteAdmin(
  supabase: SupabaseClient,
  reporteId: number,
  nuevoEstadoId: number,
  usuarioId: string,
  comentario?: string
) {
  // Verificar que el usuario sea admin
  const { isAdmin, error: adminError } = await verificarEsAdmin(supabase, usuarioId);

  if (adminError) {
    console.error("Error al verificar permisos de admin:", adminError);
    return { success: false, error: adminError };
  }

  if (!isAdmin) {
    const error = new Error("No tienes permisos de administrador para realizar esta acción");
    console.error(error.message);
    return { success: false, error };
  }

  // Obtener el estado actual del reporte
  const { data: reporte, error: reporteError } = await supabase
    .from("reportes")
    .select("estado_id")
    .eq("id", reporteId)
    .single();

  if (reporteError) {
    console.error("Error al obtener reporte:", reporteError);
    return { success: false, error: reporteError };
  }

  const estadoAnteriorId = reporte?.estado_id;

  // Usar la función existente actualizarEstadoReporte
  const { success, error } = await actualizarEstadoReporte(
    supabase,
    reporteId,
    nuevoEstadoId,
    estadoAnteriorId,
    usuarioId,
    comentario || "Cambio de estado realizado por administrador"
  );

  return { success, error };
}