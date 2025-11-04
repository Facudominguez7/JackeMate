"use client"

import { useTransition } from "react"
import { FiltrosReportes } from "@/components/filtros-reportes"

type ReportesClientWrapperProps = {
  categorias: { id: number; nombre: string }[]
  estados: { id: number; nombre: string }[]
  prioridades: { id: number; nombre: string }[]
}

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
