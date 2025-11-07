import { SupabaseClient } from "@supabase/supabase-js";
import { verificarEsAdmin } from "./verificar-admin";
import { actualizarEstadoReporte } from "@/database/queries/reportes/[id]/votos";

/**
 * Cambia el estado de un reporte. Solo usuarios con rol admin pueden ejecutar esta acción.
 * 
 * @param supabase - Cliente de Supabase
 * @param reporteId - ID del reporte a modificar
 * @param nuevoEstadoId - ID del nuevo estado
 * @param usuarioId - ID del usuario que realiza el cambio (debe ser admin)
 * @param comentario - Comentario opcional sobre el cambio de estado
 * @returns Un objeto con `success` (boolean) y `error` (null o el error ocurrido)
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
