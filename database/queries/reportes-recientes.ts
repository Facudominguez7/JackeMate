import { SupabaseClient } from "@supabase/supabase-js";

export type ReporteReciente = {
  id: number;
  titulo: string;
  descripcion: string;
  created_at: string;
  lat: number;
  lon: number;
  categorias: any;
  prioridades: any;
  estados: any;
  fotos_reporte: any;
  profiles: any;
};

/**
 * Devuelve los reportes más recientes, ordenados por fecha de creación y excluyendo los eliminados.
 *
 * La consulta filtra registros con `deleted_at` distinto de null, ordena por `created_at` en orden descendente
 * y limita la cantidad de resultados según el parámetro `limit`.
 *
 * @param limit - Número máximo de reportes a devolver. Por defecto 3.
 * @returns Array<ReporteReciente> con los reportes solicitados; devuelve un array vacío si ocurre un error o no hay resultados.
 */
export async function getReportesRecientes(
  supabase: SupabaseClient,
  limit: number = 3
): Promise<ReporteReciente[]> {
  try {
    const { data: reportes, error: reportesError } = await supabase
      .from("reportes")
      .select(
        `
        id,
        titulo,
        descripcion,
        created_at,
        lat,
        lon,
        categorias (nombre),
        prioridades (nombre),
        estados (nombre),
        fotos_reporte (url),
        profiles (username)
      `
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (reportesError) {
      console.error("Error al obtener reportes recientes:", reportesError);
      return [];
    }

    return reportes || [];
  } catch (error) {
    console.error("Error al obtener reportes recientes:", error);
    return [];
  }
}