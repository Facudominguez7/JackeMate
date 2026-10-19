"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Mail } from "lucide-react"

import { vincularCorreoInvitado, type AuthFormState } from "@/app/auth/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LinkEmailFormProps = {
  /** Email waiting for verification (`user.new_email`), if a link was already requested. */
  pendingEmail: string | null
}

const initialState: AuthFormState = { error: undefined, message: undefined }

/**
 * "Guardar mi cuenta" form: links an email to the current guest identity so its
 * reports can be recovered from any device after verification.
 */
export function LinkEmailForm({ pendingEmail }: LinkEmailFormProps) {
  const [state, formAction] = useActionState(vincularCorreoInvitado, initialState)

  return (
    <form action={formAction} className="space-y-3">
      {pendingEmail && !state?.message && (
        <Alert>
          <AlertTitle>Verificación pendiente</AlertTitle>
          <AlertDescription>
            Enviamos un enlace a {pendingEmail}. Abrilo desde este navegador y después creá tu contraseña, o ingresá
            otro correo.
          </AlertDescription>
        </Alert>
      )}
      {state?.message && (
        <Alert>
          <AlertTitle>Revisá tu correo</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state?.error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos guardar tu cuenta</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="guest-email">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="guest-email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            className="pl-10"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Enviando..." : "Guardar mi cuenta"}
    </Button>
  )
}
