import type { MetadataRoute } from "next"

import { getSitemapReportes } from "@/database/queries/reportes/seo"
import { SITE_URL, buildSitemap } from "@/lib/seo/site"

// New reports reach search engines within the hour without querying the database on every crawl.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(SITE_URL, await getSitemapReportes())
}
