import type { Metadata, MetadataRoute } from "next"

export const SITE_NAME = "Reporty"
export const PRODUCTION_SITE_URL = "https://reporty.com.ar"
export const SITE_DESCRIPTION =
  "Encontrá problemas de la ciudad en el mapa o contá qué está pasando en tu barrio. Reportes ciudadanos de Posadas, Misiones."

export const DEFAULT_OG_IMAGE = {
  url: "/og/reporty.jpg",
  width: 1200,
  height: 630,
  alt: "Reporty: reportes ciudadanos de Posadas, Misiones",
}

/** Open Graph fields every page repeats: a page's `openGraph` replaces the layout's whole object. */
export const BASE_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "es_AR",
  type: "website" as const,
  images: [DEFAULT_OG_IMAGE],
}

/** Pages that must never show up in search results: sign-in, private panels, the report form. */
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false }

/**
 * The absolute origin used for canonical URLs, the sitemap and preview images. It comes from the
 * app URL the emails already use; a missing or malformed value falls back to the production domain.
 */
export function resolveSiteUrl(value: string | undefined): string {
  try {
    const url = new URL(value ?? "")
    if (url.protocol !== "http:" && url.protocol !== "https:") return PRODUCTION_SITE_URL
    return url.origin
  } catch {
    return PRODUCTION_SITE_URL
  }
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_APP_URL)

/** One-line description for search results and previews, cut on a word boundary. */
export function summarize(text: string, maxLength = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= maxLength) return clean

  const cut = clean.slice(0, maxLength - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** Supabase returns `timestamp without time zone` values with no offset; they are stored in UTC. */
export function parseDatabaseDate(value: string): Date {
  return new Date(/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`)
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...BASE_OPEN_GRAPH, url: path, title: `${title} · ${SITE_NAME}`, description },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description },
  }
}

const PUBLIC_PATHS = ["/", "/mapa", "/reportes", "/comunidad"]

export function buildSitemap(
  siteUrl: string,
  reportes: Array<{ id: number; created_at: string }>,
): MetadataRoute.Sitemap {
  return [
    ...PUBLIC_PATHS.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "daily" as const })),
    ...reportes.map((reporte) => ({
      url: `${siteUrl}/reportes/${reporte.id}`,
      lastModified: parseDatabaseDate(reporte.created_at),
      changeFrequency: "weekly" as const,
    })),
  ]
}
