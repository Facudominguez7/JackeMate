import type { Metadata } from "next"

import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE, NO_INDEX, SITE_NAME, parseDatabaseDate, summarize } from "./site"

export type ReportSeo = {
  id: number
  titulo: string
  descripcion: string | null
  created_at: string
  categoria: string | null
  estado: string | null
  imageUrl: string | null
}

/** Title, description and photo of a report, for search results and shared-link previews. */
export function buildReportMetadata(reporte: ReportSeo | null): Metadata {
  if (!reporte) {
    return { title: "Reporte no encontrado", robots: NO_INDEX }
  }

  const path = `/reportes/${reporte.id}`
  const description =
    summarize(reporte.descripcion ?? "") ||
    `Reporte de ${reporte.categoria ?? "un problema urbano"} en Posadas, Misiones.${reporte.estado ? ` Estado: ${reporte.estado}.` : ""}`
  const socialTitle = `${reporte.titulo} · ${SITE_NAME}`
  const images = reporte.imageUrl ? [{ url: reporte.imageUrl, alt: reporte.titulo }] : [DEFAULT_OG_IMAGE]

  return {
    title: reporte.titulo,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      type: "article",
      url: path,
      title: socialTitle,
      description,
      publishedTime: parseDatabaseDate(reporte.created_at).toISOString(),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: images.map((image) => image.url),
    },
  }
}
