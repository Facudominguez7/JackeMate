"use client"

import { useCallback, useState, useTransition } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { FiltrosReportes } from "@/components/filtros-reportes"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent } from "@/components/ui/drawer"

type ReportesClientWrapperProps = {
  categorias: { id: number; nombre: string }[]
  estados: { id: number; nombre: string }[]
  prioridades: { id: number; nombre: string }[]
}

/**
 * Componente cliente que muestra la interfaz de filtros para reportes y un indicador flotante mientras hay una transición pendiente.
 *
 * @param categorias - Array de categorías, cada elemento con `id` (número) y `nombre` (cadena).
 * @param estados - Array de estados, cada elemento con `id` (número) y `nombre` (cadena).
 * @param prioridades - Array de prioridades, cada elemento con `id` (número) y `nombre` (cadena).
 * @returns Elemento JSX que renderiza el componente de filtros y muestra un badge flotante con "Aplicando filtros..." durante la transición.
 */
export function ReportesClientWrapper({ categorias, estados, prioridades }: ReportesClientWrapperProps) {
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const activeFilters = [
    searchParams.get("search"),
    searchParams.get("categoria"),
    searchParams.get("estado"),
    searchParams.get("prioridad"),
  ].filter(Boolean).length

  const activeFiltersLabel = activeFilters > 0 ? `Filtros (${activeFilters})` : "Filtros"

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setShowFilters(open)

    if (open && typeof document !== "undefined") {
      const active = document.activeElement
      if (active instanceof HTMLElement) {
        active.blur()
      }
    }
  }, [])

  return (
    <>
      {isPending && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="font-medium text-sm">Aplicando filtros...</span>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        className="min-h-9 rounded-full border border-border bg-secondary px-3.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground focus-visible:ring-ring focus-visible:ring-offset-0"
        onClick={() => setShowFilters((prev) => !prev)}
        aria-label={showFilters ? "Cerrar filtros" : `Abrir filtros${activeFilters > 0 ? `, ${activeFilters} activos` : ""}`}
        aria-expanded={showFilters}
      >
        {showFilters ? <X className="size-4" aria-hidden="true" /> : <SlidersHorizontal className="size-4" aria-hidden="true" />}
        <span>{showFilters ? "Cerrar" : activeFiltersLabel}</span>
      </Button>

      <Drawer open={showFilters} onOpenChange={handleDrawerOpenChange}>
        <DrawerContent className="max-h-[85dvh]">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <FiltrosReportes
              categorias={categorias}
              estados={estados}
              prioridades={prioridades}
              externalIsPending={isPending}
              externalStartTransition={startTransition}
              variant="sheet"
              onApply={() => setShowFilters(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
