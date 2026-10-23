import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/seo/site"

// Private pages are kept out of results with a `noindex` tag, not blocked here: a blocked page
// can still be indexed from links, because the crawler never gets to read its `noindex`.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
