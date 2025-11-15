import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Tipo de datos para estadísticas por categoría
 */
export type ReportesPorCategoria = {
  categoria: string;
  cantidad: number;
  color: string;
};

/**
 * Tipo de datos para tiempo promedio de resolución
 */
export type TiempoPromedioResolucion = {
  diasPromedio: number;
  horasPromedio: number;
};

/**
 * Tipo de datos para zonas con más reportes
 */
export type ZonaConReportes = {
  lat: number;
  lon: number;
  cantidad: number;
  ultimoReporte: string;
};

/**
 * Agrupa los reportes por categoría y devuelve el conteo ordenado por cantidad.
 *
 * Asigna a cada categoría un color tomado de una paleta fija.
 *
 * @returns Arreglo de objetos ReportesPorCategoria con los campos `categoria`, `cantidad` y `color`, ordenados por `cantidad` de mayor a menor.
 */
export async function getReportesPorCategoria(
  supabase: SupabaseClient
): Promise<ReportesPorCategoria[]> {
  try {
    const { data, error } = await supabase
      .from("reportes")
      .select("categoria_id, categorias (nombre)")
      .is("deleted_at", null);

    if (error) {
      console.error("Error al obtener reportes por categoría:", error);
      return [];
    }

    // Agrupar y contar por categoría
    const categoriaMap = new Map<string, number>();
    data.forEach((reporte: any) => {
      const categoria = reporte.categorias?.nombre || "Sin categoría";
      categoriaMap.set(categoria, (categoriaMap.get(categoria) || 0) + 1);
    });

    // Paleta de colores para las categorías
    const colores = [
      "#3b82f6", // azul
      "#ef4444", // rojo
      "#10b981", // verde
      "#f59e0b", // amarillo
      "#8b5cf6", // morado
      "#ec4899", // rosa
      "#14b8a6", // cyan
      "#f97316", // naranja
    ];

    // Convertir a array y ordenar por cantidad
    return Array.from(categoriaMap.entries())
      .map(([categoria, cantidad], index) => ({
        categoria,
        cantidad,
        color: colores[index % colores.length],
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  } catch (error) {
    console.error("Error en getReportesPorCategoria:", error);
    return [];
  }
}

/**
 * Calcula el tiempo promedio desde la creación hasta la resolución de reportes.
 *
 * Considera como resolución el primer cambio de estado a "Reparado" (estado 2) para cada reporte; devuelve los promedios en días y en horas redondeados a una décima.
 *
 * @returns Un objeto con `diasPromedio` y `horasPromedio` (valores numéricos redondeados a una décima). Ambos serán `0` si no hay datos válidos.
 */
export async function getTiempoPromedioResolucion(
  supabase: SupabaseClient
): Promise<TiempoPromedioResolucion> {
  try {
    // Obtener reportes resueltos con sus fechas
    const { data: reportesResueltos, error: reportesError } = await supabase
      .from("reportes")
      .select("id, created_at")
      .eq("estado_id", 2) // Estado "Reparado"
      .is("deleted_at", null);

    if (reportesError || !reportesResueltos || reportesResueltos.length === 0) {
      return { diasPromedio: 0, horasPromedio: 0 };
    }

    // Para cada reporte resuelto, obtener la fecha del cambio a estado "Reparado"
    const tiemposResolucion: number[] = [];

    for (const reporte of reportesResueltos) {
      const { data: historial, error: historialError } = await supabase
        .from("historial_estados")
        .select("created_at")
        .eq("reporte_id", reporte.id)
        .eq("estado_nuevo_id", 2) // Cambio a estado "Reparado"
        .order("created_at", { ascending: true })
        .limit(1);

      if (!historialError && historial && historial.length > 0) {
        const fechaCreacion = new Date(reporte.created_at);
        const fechaResolucion = new Date(historial[0].created_at);
        const tiempoMs = fechaResolucion.getTime() - fechaCreacion.getTime();
        tiemposResolucion.push(tiempoMs);
      }
    }

    if (tiemposResolucion.length === 0) {
      return { diasPromedio: 0, horasPromedio: 0 };
    }

    // Calcular promedio
    const promedioMs =
      tiemposResolucion.reduce((acc, tiempo) => acc + tiempo, 0) /
      tiemposResolucion.length;

    const diasPromedio = promedioMs / (1000 * 60 * 60 * 24);
    const horasPromedio = promedioMs / (1000 * 60 * 60);

    return {
      diasPromedio: Math.round(diasPromedio * 10) / 10,
      horasPromedio: Math.round(horasPromedio * 10) / 10,
    };
  } catch (error) {
    console.error("Error en getTiempoPromedioResolucion:", error);
    return { diasPromedio: 0, horasPromedio: 0 };
  }
}

/**
 * Obtiene las zonas geográficas con más reportes agrupando reportes cercanos (~0.001° ≈ 100 m).
 *
 * @returns Arreglo de zonas ordenado por cantidad descendente; cada elemento contiene `lat`, `lon`, `cantidad` y `ultimoReporte` (fecha ISO del reporte más reciente)
 */
export async function getZonasConMasReportes(
  supabase: SupabaseClient,
  limite: number = 10
): Promise<ZonaConReportes[]> {
  try {
    const { data, error } = await supabase
      .from("reportes")
      .select("lat, lon, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error al obtener zonas con más reportes:", error);
      return [];
    }

    // Agrupar reportes por proximidad (~0.001 grados ≈ 100m)
    const precision = 0.001;
    const zonasMap = new Map<string, ZonaConReportes>();

    data.forEach((reporte: any) => {
      const latRedondeada = Math.round(reporte.lat / precision) * precision;
      const lonRedondeada = Math.round(reporte.lon / precision) * precision;
      const key = `${latRedondeada},${lonRedondeada}`;

      const zonaExistente = zonasMap.get(key);
      if (zonaExistente) {
        zonaExistente.cantidad++;
        // Mantener la fecha del reporte más reciente
        if (new Date(reporte.created_at) > new Date(zonaExistente.ultimoReporte)) {
          zonaExistente.ultimoReporte = reporte.created_at;
        }
      } else {
        zonasMap.set(key, {
          lat: latRedondeada,
          lon: lonRedondeada,
          cantidad: 1,
          ultimoReporte: reporte.created_at,
        });
      }
    });

    // Convertir a array, ordenar por cantidad y retornar los top N
    return Array.from(zonasMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limite);
  } catch (error) {
    console.error("Error en getZonasConMasReportes:", error);
    return [];
  }
}

/**
 * Obtiene estadísticas agregadas para el dashboard de Interesado.
 *
 * @returns Un objeto con las siguientes métricas:
 * - `totalReportes`: número total de reportes no eliminados.
 * - `reportesResueltos`: número de reportes con `estado_id = 2`.
 * - `reportesPendientes`: número de reportes con `estado_id = 1`.
 * - `reportesEnProgreso`: número de reportes con `estado_id = 3`.
 * - `tasaResolucion`: porcentaje entero de reportes resueltos respecto del total (0–100).
 */
export async function getEstadisticasInteresado(supabase: SupabaseClient) {
  try {
    // Obtener estadísticas básicas
    const { count: totalReportes } = await supabase
      .from("reportes")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    const { count: reportesResueltos } = await supabase
      .from("reportes")
      .select("*", { count: "exact", head: true })
      .eq("estado_id", 2)
      .is("deleted_at", null);

    const { count: reportesPendientes } = await supabase
      .from("reportes")
      .select("*", { count: "exact", head: true })
      .eq("estado_id", 1)
      .is("deleted_at", null);

    const { count: reportesEnProgreso } = await supabase
      .from("reportes")
      .select("*", { count: "exact", head: true })
      .eq("estado_id", 3)
      .is("deleted_at", null);

    // Calcular tasa de resolución
    const tasaResolucion =
      totalReportes && totalReportes > 0
        ? Math.round((reportesResueltos || 0) / totalReportes * 100)
        : 0;

    return {
      totalReportes: totalReportes || 0,
      reportesResueltos: reportesResueltos || 0,
      reportesPendientes: reportesPendientes || 0,
      reportesEnProgreso: reportesEnProgreso || 0,
      tasaResolucion,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de interesado:", error);
    return {
      totalReportes: 0,
      reportesResueltos: 0,
      reportesPendientes: 0,
      reportesEnProgreso: 0,
      tasaResolucion: 0,
    };
  }
}