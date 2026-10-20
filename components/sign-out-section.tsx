"use client"

import { useState, useTransition, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

import { signout } from "@/app/auth/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const SIGN_OUT_ERROR = "No pudimos cerrar la sesión"

const SIGN_OUT_ERROR_DESCRIPTIONS = {
  failed: "Por favor, intenta nuevamente",
  guest: "Las cuentas de invitado no pueden cerrar sesión: perderían el acceso a sus reportes.",
} as const

/**
 * Account section with the sign-out action, confirmed in a dialog. Render it only for accounts
 * with email and password; `signout` also refuses guest sessions on the server, because a guest
 * that signs out loses access to its reports for good.
 */
export function SignOutSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const confirmSignOut = (event: MouseEvent<HTMLButtonElement>) => {
    // Keep the dialog open while the session closes so the pending state stays visible.
    event.preventDefault()

    startTransition(async () => {
      try {
        const result = await signout()

        if (!result.ok) {
          toast.error(SIGN_OUT_ERROR, { description: SIGN_OUT_ERROR_DESCRIPTIONS[result.reason] })
          return
        }

        setOpen(false)
        toast.success("Sesión cerrada")
        router.replace("/")
      } catch {
        toast.error(SIGN_OUT_ERROR, { description: SIGN_OUT_ERROR_DESCRIPTIONS.failed })
      }
    })
  }

  return (
    <section aria-labelledby="sign-out-title">
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 id="sign-out-title" className="text-sm font-semibold">
              Sesión
            </h2>
            <p className="text-sm text-muted-foreground">Salí de tu cuenta en todos tus dispositivos.</p>
          </div>

          <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full text-destructive hover:text-destructive sm:w-auto">
                <LogOut className="size-4" aria-hidden="true" />
                Cerrar sesión
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vas a salir de tu cuenta en todos los dispositivos donde la tengas abierta. Para volver a entrar vas a
                  necesitar tu email y tu contraseña.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmSignOut}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <>
                      <span
                        className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden="true"
                      />
                      Cerrando sesión...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 size-4" aria-hidden="true" />
                      Cerrar sesión
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </section>
  )
}
