import { describe, expect, it } from "vitest"

import { buildReportMetadata } from "./report-metadata"

const reporte = {
  id: 67,
  titulo: "Bache en Av. Uruguay",
  descripcion: "Un pozo profundo frente a la escuela, ocupa medio carril.",
  created_at: "2026-10-20T15:30:00",
  categoria: "Baches",
  estado: "Pendiente",
  imageUrl: "https://cdn.example/reportes/67.webp",
}

describe("buildReportMetadata", () => {
  it("uses the report title, description and photo for search results and link previews", () => {
    const metadata = buildReportMetadata(reporte)

    expect(metadata.title).toBe("Bache en Av. Uruguay")
    expect(metadata.description).toBe("Un pozo profundo frente a la escuela, ocupa medio carril.")
    expect(metadata.alternates).toEqual({ canonical: "/reportes/67" })
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      siteName: "Reporty",
      url: "/reportes/67",
      title: "Bache en Av. Uruguay · Reporty",
      publishedTime: "2026-10-20T15:30:00.000Z",
      images: [{ url: "https://cdn.example/reportes/67.webp", alt: "Bache en Av. Uruguay" }],
    })
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: ["https://cdn.example/reportes/67.webp"] })
    expect(metadata.robots).toBeUndefined()
  })

  it("describes the report from its category and state when it has no description", () => {
    const metadata = buildReportMetadata({ ...reporte, descripcion: "  " })

    expect(metadata.description).toBe("Reporte de Baches en Posadas, Misiones. Estado: Pendiente.")
  })

  it("keeps the default Reporty image when the report has no photo", () => {
    const metadata = buildReportMetadata({ ...reporte, imageUrl: null })

    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ url: "/og/reporty.jpg" })])
  })

  it("keeps a missing report out of search results", () => {
    const metadata = buildReportMetadata(null)

    expect(metadata.title).toBe("Reporte no encontrado")
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
