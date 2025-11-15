import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recupera contadores generales de la plataforma: usuarios activos, reportes totales y reportes resueltos.
 *
 * Si ocurre un error durante las consultas, devuelve ceros para todos los contadores.
 *
 * @returns `totalUsers` — número de usuarios activos; `totalReports` — número de reportes no eliminados; `resolvedReports` — número de reportes con estado "Reparado" (estado_id = 2). Los contadores serán 0 si no se obtiene un valor o si ocurre un error.
 */
export async function getEstadisticas(supabase: SupabaseClient) {
  try {
    // Contar usuarios activos (profiles)
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Contar reportes totales (no eliminados)
    const { count: reportsCount } = await supabase
      .from("reportes")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Contar reportes resueltos (estado_id = 2 que es "Reparado")
    const { count: resolvedCount } = await supabase
      .from("reportes")
      .select("*", { count: "exact", head: true })
      .eq("estado_id", 2)
      .is("deleted_at", null);

    return {
      totalUsers: usersCount || 0,
      totalReports: reportsCount || 0,
      resolvedReports: resolvedCount || 0,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return {
      totalUsers: 0,
      totalReports: 0,
      resolvedReports: 0,
    };
  }
}