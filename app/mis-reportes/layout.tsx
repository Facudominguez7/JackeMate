import type { Metadata } from "next"

import { NO_INDEX } from "@/lib/seo/site"

// Private or form-only pages: useful to whoever is signed in, never as a search result.
export const metadata: Metadata = { robots: NO_INDEX }

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return children
}
