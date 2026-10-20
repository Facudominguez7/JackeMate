"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

// Recharts is the heaviest client dependency of /dashboard. Loading the charts on demand keeps it
// out of the page's shared chunks, so only analytics views download it. Import these wrappers
// directly, not through the `@/components/dashboard` barrel, which references the charts statically.
function ChartLoadingSkeleton() {
  return <Skeleton className="h-[380px] w-full rounded-[var(--radius)]" />
}

export const GraficoReportesPorCategoriaDiferido = dynamic(
  () => import("./grafico-categorias").then((m) => m.GraficoReportesPorCategoria),
  { loading: ChartLoadingSkeleton },
)

export const GraficoZonasCalientesDiferido = dynamic(
  () => import("./lista-zonas-calientes").then((m) => m.GraficoZonasCalientes),
  { loading: ChartLoadingSkeleton },
)
