"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Mail } from "lucide-react"

import { solicitarRecuperacionContrasena, type AuthFormState } from "../actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: AuthFormState = { error: undefined, message: undefined }

/** Requests the password recovery email. */
export function RecoveryForm() {
  const [state, formAction] = useActionState(solicitarRecuperacionContrasena, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <Alert>
          <AlertTitle>Revisá tu correo</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state?.error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos enviar el enlace</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="recovery-email">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="recovery-email"
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
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviarme el enlace"}
    </Button>
  )
}
