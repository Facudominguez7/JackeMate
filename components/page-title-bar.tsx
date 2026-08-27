/**
 * Módulo compartido para renderizar títulos de página con acciones opcionales.
 */

import { LogOut } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

type PageTitleBarProps = {
  leading?: ReactNode
  title: ReactNode
  actions?: ReactNode
  mostrarCerrarSesion?: boolean
  cerrarSesionAction?: (formData: FormData) => void | Promise<void>
}

/**
 * Renderiza una barra de título centrada con contenido inicial, acciones y cierre de sesión opcional.
 */
export function PageTitleBar({
  leading,
  title,
  actions,
  mostrarCerrarSesion = false,
  cerrarSesionAction,
}: PageTitleBarProps) {
  const formularioCerrarSesion = mostrarCerrarSesion && cerrarSesionAction ? (
    <form action={cerrarSesionAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
        aria-label="Cerrar sesión de la cuenta"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        Cerrar sesión
      </Button>
    </form>
  ) : null

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="min-w-0 justify-self-start">{leading}</div>
      <h1 className="justify-self-center border-b-2 border-primary/50 px-2 text-center text-lg font-semibold tracking-tight text-foreground md:px-3 md:text-2xl">
        {title}
      </h1>
      <div className="flex min-w-0 items-center gap-2 justify-self-end">
        {actions}
        {formularioCerrarSesion}
      </div>
    </div>
  )
}
