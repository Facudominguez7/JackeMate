"use client"

import { useTransition } from "react"
import { FiltrosReportes } from "@/components/filtros-reportes"

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
  const [isPending, startTransition] = useTransition()

  return (
    <>
      {/* Loader flotante sobre toda la página */}
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
      
      <FiltrosReportes
        categorias={categorias}
        estados={estados}
        prioridades={prioridades}
        externalIsPending={isPending}
        externalStartTransition={startTransition}
      />
    </>
  )
}