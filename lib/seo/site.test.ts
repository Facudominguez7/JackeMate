import { describe, expect, it } from "vitest"

import { buildSitemap, pageMetadata, PRODUCTION_SITE_URL, resolveSiteUrl, summarize } from "./site"

describe("resolveSiteUrl", () => {
  it("uses the app URL without a trailing slash", () => {
    expect(resolveSiteUrl("https://reporty.com.ar/")).toBe("https://reporty.com.ar")
    expect(resolveSiteUrl("http://localhost:3000")).toBe("http://localhost:3000")
  })

  it("falls back to the production domain when the app URL is missing or invalid", () => {
    expect(resolveSiteUrl(undefined)).toBe(PRODUCTION_SITE_URL)
    expect(resolveSiteUrl("")).toBe(PRODUCTION_SITE_URL)
    expect(resolveSiteUrl("reporty.com.ar")).toBe(PRODUCTION_SITE_URL)
  })
})

describe("summarize", () => {
  it("collapses whitespace and keeps short texts whole", () => {
    expect(summarize("  Bache   grande\nen la esquina ")).toBe("Bache grande en la esquina")
  })

  it("cuts long texts on a word boundary and adds an ellipsis", () => {
    const text = "palabra ".repeat(40)
    const summary = summarize(text, 50)

    expect(summary.length).toBeLessThanOrEqual(50)
    expect(summary.endsWith("…")).toBe(true)
    expect(summary).not.toMatch(/\s…$/)
  })
})

describe("pageMetadata", () => {
  it("sets the canonical URL and repeats the shared Open Graph fields", () => {
    const metadata = pageMetadata({ title: "Reportes", description: "Lista de reportes.", path: "/reportes" })

    expect(metadata.title).toBe("Reportes")
    expect(metadata.description).toBe("Lista de reportes.")
    expect(metadata.alternates).toEqual({ canonical: "/reportes" })
    expect(metadata.openGraph).toMatchObject({
      siteName: "Reporty",
      locale: "es_AR",
      type: "website",
      url: "/reportes",
      title: "Reportes · Reporty",
      description: "Lista de reportes.",
    })
  })
})

describe("buildSitemap", () => {
  it("lists the public pages and every report with its date", () => {
    const sitemap = buildSitemap("https://reporty.com.ar", [
      { id: 7, created_at: "2026-10-01T12:00:00" },
    ])

    expect(sitemap.map((entry) => entry.url)).toEqual([
      "https://reporty.com.ar/",
      "https://reporty.com.ar/mapa",
      "https://reporty.com.ar/reportes",
      "https://reporty.com.ar/comunidad",
      "https://reporty.com.ar/reportes/7",
    ])
    expect(sitemap.at(-1)?.lastModified).toEqual(new Date("2026-10-01T12:00:00Z"))
  })

  it("never lists private pages", () => {
    const urls = buildSitemap("https://reporty.com.ar", []).map((entry) => entry.url)

    for (const privatePath of ["/auth", "/dashboard", "/mis-reportes", "/reportes/nuevo"]) {
      expect(urls).not.toContain(`https://reporty.com.ar${privatePath}`)
    }
  })
})
