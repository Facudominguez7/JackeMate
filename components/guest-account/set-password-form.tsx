"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Lock } from "lucide-react"

import { crearContrasenaCuenta, type AuthFormState } from "@/app/auth/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MIN_PASSWORD_LENGTH } from "@/lib/authz/guest-account"

const initialState: AuthFormState = { error: undefined, message: undefined }

/**
 * Last step of saving a guest account: after the linked email is verified, the user
 * creates the password used to sign in from any device.
 */
export function SetPasswordForm() {
  const [state, formAction] = useActionState(crearContrasenaCuenta, initialState)

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos crear tu contraseña</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="account-password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="account-password"
            name="password"
            type="password"
            className="pl-10"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-confirm-password">Repetir contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="account-confirm-password"
            name="confirm_password"
            type="password"
            className="pl-10"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
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
      {pending ? "Guardando..." : "Crear contraseña"}
    </Button>
  )
}
