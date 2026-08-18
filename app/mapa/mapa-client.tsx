"use client"

import { useCallback, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { AlertCircle, FilePlus2, List, Plus, Search, SlidersHorizontal, X } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { FiltrosReportes } from "@/components/filtros-reportes"
import { LoadingLogo } from "@/components/loading-logo"
import type { ReportMapItem } from "@/database/queries/reportes/get-reportes"
import { cn } from "@/lib/utils"

const MapContainer = dynamic(() => import("@/components/map-container").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <LoadingLogo size="md" text="Cargando mapa..." />
    </div>
  ),
})

type MapaClientProps = {
  reportes: ReportMapItem[]
  categorias: { id: number; nombre: string }[]
  estados: { id: number; nombre: string }[]
  prioridades: { id: number; nombre: string }[]
  error: string | null
  isAuthenticated: boolean
}

export function MapaClient({ reportes, categorias, estados, prioridades, error }: MapaClientProps) {
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isPending, startTransition] = useTransition()

  const activeFilters = [
    searchParams.get("search"),
    searchParams.get("categoria"),
    searchParams.get("estado"),
    searchParams.get("prioridad"),
  ].filter(Boolean).length

  const activeFiltersLabel = `${activeFilters} filtro${activeFilters === 1 ? "" : "s"} activo${activeFilters === 1 ? "" : "s"}`

  const handleFilterApplied = useCallback(() => {
    setShowFilters(false)
  }, [])

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setShowFilters(open)
    if (open && typeof document !== "undefined") {
      const active = document.activeElement
      if (active instanceof HTMLElement) {
        active.blur()
      }
    }
  }, [])

  const mapActionLinkClassName = cn(
    buttonVariants({ size: "sm" }),
    "min-h-11 rounded-full bg-[var(--secondary)] px-4 text-sm font-semibold text-[var(--secondary-foreground)] shadow-lg hover:bg-[var(--secondary)]/90 focus-visible:ring-primary focus-visible:ring-offset-[var(--secondary)]"
  )

  return (
    <div className="relative h-[100dvh] min-h-[32rem] overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        {error ? (
          <div className="flex h-full items-center justify-center p-5">
            <Alert variant="destructive" className="max-w-lg shadow-xl">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertTitle>Error al cargar el mapa</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <MapContainer reports={reportes} showLegend />
        )}
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-30 pt-[max(env(safe-area-inset-top),0rem)] sm:left-5 sm:top-5">
        <div className="flex items-start gap-2">
          <Button
            type="button"
            size="icon"
            className="pointer-events-auto size-[3.25rem] rounded-full border border-[var(--secondary-foreground)]/10 bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-lg hover:bg-[var(--secondary)]/90 hover:text-[var(--secondary-foreground)] focus-visible:ring-primary focus-visible:ring-offset-[var(--secondary)]"
            onClick={(e) => {
              e.currentTarget.blur()
              setShowFilters((prev) => !prev)
            }}
            aria-label={showFilters ? "Cerrar filtros" : "Abrir filtros"}
            aria-expanded={showFilters}
          >
            {showFilters ? <X className="size-5" aria-hidden="true" /> : <SlidersHorizontal className="size-5" aria-hidden="true" />}
          </Button>
          {activeFilters > 0 && !showFilters && (
            <button
              type="button"
              className="pointer-events-auto mt-1 inline-flex min-h-9 max-w-[11rem] items-center gap-1.5 rounded-full border border-[var(--secondary-foreground)]/10 bg-[var(--secondary)]/90 px-3 text-left text-[11px] font-semibold leading-none text-[var(--secondary-foreground)] shadow-lg backdrop-blur transition-colors hover:bg-[var(--secondary)]"
              onClick={() => setShowFilters(true)}
              aria-label={`Abrir filtros, ${activeFiltersLabel}`}
            >
              <Search className="size-3.5" aria-hidden="true" />
              <span className="truncate">{activeFiltersLabel}</span>
            </button>
          )}
        </div>
      </div>

      <Drawer open={showFilters} onOpenChange={handleDrawerOpenChange}>
        <DrawerContent className="max-h-[85dvh]">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <FiltrosReportes
              categorias={categorias}
              estados={estados}
              prioridades={prioridades}
              onFilterApplied={handleFilterApplied}
              externalIsPending={isPending}
              externalStartTransition={startTransition}
              variant="sheet"
              onApply={() => setShowFilters(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {isPending && (
        <div className="absolute left-1/2 top-32 z-40 -translate-x-1/2 rounded-full border border-border bg-card/95 px-4 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur">
          Aplicando filtros...
        </div>
      )}

      <div className="absolute bottom-[calc(6.75rem+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-3 sm:right-6">
        {showActions && (
          <div className="flex flex-col items-end gap-2">
            <Link href="/reportes" className={mapActionLinkClassName}>
              <List className="size-4" aria-hidden="true" />
              Ver reportes
            </Link>
            <Link href="/reportes/nuevo" className={mapActionLinkClassName}>
              <FilePlus2 className="size-4" aria-hidden="true" />
              Crear reporte
            </Link>
          </div>
        )}
        <Button
          type="button"
          size="icon"
          className="size-[3.75rem] rounded-2xl bg-primary text-primary-foreground shadow-xl hover:bg-primary/90"
          onClick={() => setShowActions((prev) => !prev)}
          aria-label={showActions ? "Cerrar acciones de reportes" : "Abrir acciones de reportes"}
          aria-expanded={showActions}
        >
          {showActions ? <X className="size-6" aria-hidden="true" /> : <Plus className="size-6" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )
}
