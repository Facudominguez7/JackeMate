import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene el email y username del propietario de un reporte específico.
 * 
 * Nota: Esta función obtiene el email directamente de la tabla profiles.
 * Asegúrate de que la tabla profiles tenga el campo email sincronizado con auth.users.
 * 
 * @param supabase - Cliente de Supabase configurado
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
          username,
          email
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
    
    const email = Array.isArray(profiles) 
      ? profiles[0]?.email || null
      : profiles?.email || null;

    return {
      data: {
        userId: reporteData.usuario_id,
        username,
        email,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error en getReporteOwnerInfo:", error);
    return { data: null, error };
  }
}

/**
 * Obtiene el email de un usuario específico desde su perfil.
 * 
 * @param supabase - Cliente de Supabase configurado
 * @param userId - ID del usuario del cual obtener el email
 * @returns Objeto con data (email del usuario o null si no existe) y error
 */
export async function getUserEmail(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error al obtener email:", error);
      return { data: null, error };
    }

    return { data: data?.email || null, error: null };
  } catch (error) {
    console.error("Error en getUserEmail:", error);
    return { data: null, error };
  }
}
