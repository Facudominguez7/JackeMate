import { SupabaseClient } from "@supabase/supabase-js";
import {
  isMissingReportImageColumnsError,
  type ReportImageRow,
  type ResolvedReportImageRow,
  resolveReportImageRows,
} from "@/lib/media/report-images";

const buildReporteDetalleSelect = (includeCanonicalImageFields: boolean) => `
      id,
      titulo,
      descripcion,
      lat,
      lon,
      created_at,
      usuario_id,
      estado_id,
      categorias (nombre),
      prioridades (nombre),
      estados (id, nombre),
      fotos_reporte (${includeCanonicalImageFields ? "url, bucket, path" : "url"}),
      profiles (username)
    `

export type ReportNameRelation = { nombre: string | null } | { nombre: string | null }[] | null

export type ReportStateRelation = { id: number; nombre: string | null } | { id: number; nombre: string | null }[] | null

export type ReportUsernameRelation = { username: string | null } | { username: string | null }[] | null

type ReporteDetalleRow = {
  id: number
  titulo: string
  descripcion: string | null
  lat: number | null
  lon: number | null
  created_at: string
  usuario_id: string
  estado_id: number
  categorias: ReportNameRelation
  prioridades: ReportNameRelation
  estados: ReportStateRelation
  fotos_reporte: ReportImageRow[] | null
  profiles: ReportUsernameRelation
}

type ReporteDetalleView = Omit<ReporteDetalleRow, "fotos_reporte"> & {
  fotos_reporte: ResolvedReportImageRow[]
}

export type ReporteDetalle = ReporteDetalleView

/**
 * Recupera el registro completo de un reporte identificado por su ID, incluyendo relaciones relacionadas.
 *
 * @param reporteId - ID del reporte a recuperar
 * @returns Un objeto con `data` y `error`. `data` contiene el reporte (campos: `id`, `titulo`, `descripcion`, `lat`, `lon`, `created_at`, `usuario_id`, `estado_id`, y relaciones `categorias.nombre`, `prioridades.nombre`, `estados.{id,nombre}`, `fotos_reporte.url`, `profiles.username`) o `null` si no se encontró; `error` contiene el error de la consulta o `null` si la operación tuvo éxito.
 */
export async function getReporteDetalle(supabase: SupabaseClient, reporteId: string) {
  let { data, error } = await supabase
    .from("reportes")
    .select(buildReporteDetalleSelect(true))
    .eq("id", reporteId)
    .is("deleted_at", null)
    .returns<ReporteDetalleRow>()
    .single();

  if (error && isMissingReportImageColumnsError(error)) {
    ({ data, error } = await supabase
      .from("reportes")
      .select(buildReporteDetalleSelect(false))
      .eq("id", reporteId)
      .is("deleted_at", null)
      .returns<ReporteDetalleRow>()
      .single())
  }

  if (error) {
    console.error("Error al obtener reporte:", error);
    return { data: null, error };
  }

  const reporte = (data ?? null) as ReporteDetalleRow | null

  return {
    data: reporte
      ? {
          ...reporte,
          fotos_reporte: resolveReportImageRows(reporte.fotos_reporte),
        } satisfies ReporteDetalleView
      : null,
    error: null,
  };
}
