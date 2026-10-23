import "server-only"

import { cache } from "react"

import { getPrimaryReportImageUrl, type ReportImageRow } from "@/lib/media/report-images"
import type { ReportSeo } from "@/lib/seo/report-metadata"
import { createPublicClient } from "@/utils/supabase/public"

type NameRelation = { nombre: string | null } | { nombre: string | null }[] | null

type ReporteSeoRow = {
  id: number
  titulo: string
  descripcion: string | null
  created_at: string
  categorias: NameRelation
  estados: NameRelation
  fotos_reporte: ReportImageRow[] | null
}

function nombre(relation: NameRelation) {
  return (Array.isArray(relation) ? relation[0]?.nombre : relation?.nombre) ?? null
}

/**
 * What search engines and link previews need from a report, read as the anon role: the same for
 * every visitor. `reporte` is null when the report does not exist or was deleted; `error` means the
 * lookup itself failed, which must not be mistaken for a missing report.
 */
export const getReporteSeo = cache(async (id: string): Promise<{ reporte: ReportSeo | null; error: unknown }> => {
  if (!/^\d+$/.test(id)) return { reporte: null, error: null }

  const { data, error } = await createPublicClient()
    .from("reportes")
    .select("id, titulo, descripcion, created_at, categorias (nombre), estados (nombre), fotos_reporte (url, bucket, path)")
    .eq("id", id)
    .is("deleted_at", null)
    .returns<ReporteSeoRow[]>()
    .maybeSingle()

  if (error) return { reporte: null, error }
  if (!data) return { reporte: null, error: null }

  const row = data as ReporteSeoRow
  return {
    reporte: {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      created_at: row.created_at,
      categoria: nombre(row.categorias),
      estado: nombre(row.estados),
      imageUrl: getPrimaryReportImageUrl(row.fotos_reporte),
    },
    error: null,
  }
})

/** Every report that is still published, for the sitemap. */
export async function getSitemapReportes() {
  const { data, error } = await createPublicClient()
    .from("reportes")
    .select("id, created_at")
    .is("deleted_at", null)
    .order("id", { ascending: false })
    .limit(50000)

  if (error) console.error("Error al cargar los reportes del sitemap:", error)
  return (data ?? []) as Array<{ id: number; created_at: string }>
}
