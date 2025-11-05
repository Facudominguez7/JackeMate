import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene el email y username del propietario de un reporte específico.
 * 
 * Nota: Esta función requiere que la tabla profiles tenga una política RLS
 * que permita leer el email, o que se ejecute con un cliente de servicio.
 * 
 * @param supabase - Cliente de Supabase configurado (preferiblemente cliente de servidor)
 * @param reporteId - ID del reporte del cual obtener el propietario
 * @returns Objeto con data (email, username y userId del propietario) y error
 */
export async function getReporteOwnerInfo(
  supabase: SupabaseClient,
  reporteId: number
) {
  try {
    // Obtener el reporte junto con los datos del perfil del usuario
    const { data: reporteData, error: reporteError } = await supabase
      .from("reportes")
      .select(`
        usuario_id,
        profiles (
          username
        )
      `)
      .eq("id", reporteId)
      .is("deleted_at", null)
      .single();

    if (reporteError || !reporteData) {
      console.error("Error al obtener reporte:", reporteError);
      return { data: null, error: reporteError };
    }

    const profiles: any = reporteData.profiles;
    const username = Array.isArray(profiles) 
      ? profiles[0]?.username || "Usuario"
      : profiles?.username || "Usuario";

    return {
      data: {
        userId: reporteData.usuario_id,
        username,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error en getReporteOwnerInfo:", error);
    return { data: null, error };
  }
}
