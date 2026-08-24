"use client"

import type { ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DialogoConfirmacionOperativaProps = {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  titulo: string
  descripcion: ReactNode
  textoConfirmar: string
  enviando: boolean
  onConfirmar: () => void
  destructivo?: boolean
}

/**
 * Diálogo de confirmación genérico para toda acción operativa de cuadrillas (asignar,
 * reasignar, avanzar estado, finalizar, cancelar, desactivar cuadrilla, cierre
 * administrativo). Envuelve `AlertDialog` con el spinner inline y el bloqueo de controles
 * mientras `enviando` es `true`, mismo patrón que usa `app/reportes/[id]/page.tsx`.
 */
export function DialogoConfirmacionOperativa({
  abierto,
  onAbiertoChange,
  titulo,
  descripcion,
  textoConfirmar,
  enviando,
  onConfirmar,
  destructivo,
}: DialogoConfirmacionOperativaProps) {
  return (
    <AlertDialog open={abierto} onOpenChange={onAbiertoChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">{descripcion}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            disabled={enviando}
            className={destructivo ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {enviando ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Procesando...
              </>
            ) : (
              textoConfirmar
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
