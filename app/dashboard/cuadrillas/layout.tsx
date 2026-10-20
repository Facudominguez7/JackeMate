import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { cuadrillasHabilitadas } from "@/lib/features"

/**
 * While crews are turned off the route does not exist for anyone. `proxy.ts` already answers it
 * with a 404 before rendering; this guard covers any render that does not go through the proxy.
 */
export default function CuadrillasLayout({ children }: { children: ReactNode }) {
  if (!cuadrillasHabilitadas()) {
    notFound()
  }

  return children
}
