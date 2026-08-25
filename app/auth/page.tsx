"use client"

import type React from "react"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react"

import { login, signup, type AuthFormState } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthPage() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const initialState: AuthFormState = { error: undefined, message: undefined }
  const [loginState, loginAction] = useActionState(login, initialState)
  const [signupState, signupAction] = useActionState(signup, initialState)
  const nextPath = searchParams.get("next") ?? "/mapa"

  return (
    <div className="auth-shell bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Tu cuenta Reporty</CardTitle>
            <CardDescription>Necesitás loguearte o registrarte para visualizar o crear reportes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Ingresar</TabsTrigger>
                <TabsTrigger value="register">Registrarme</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-5 pt-2">
                {loginState?.error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error al iniciar sesión</AlertTitle>
                    <AlertDescription>Revisá por favor tus credenciales.</AlertDescription>
                  </Alert>
                )}

                <form action={loginAction} className="space-y-4">
                  <input type="hidden" name="next" value={nextPath} />
                  <Field label="Correo electrónico" htmlFor="login-email">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        autoComplete="email"
                        required
                      />
                  </Field>

                  <Field label="Contraseña" htmlFor="login-password">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        autoComplete="current-password"
                        required
                      />
                    <Button
                      type="button"
                      variant="muted"
                      size="icon-sm"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </Button>
                  </Field>

                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <Link href="mailto:hola@jackemate.app" className="text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <SubmitButton label="Ingresar" pendingLabel="Ingresando..." />
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-5 pt-2">
                {signupState?.message && (
                  <Alert>
                    <AlertTitle>Verificá tu correo</AlertTitle>
                    <AlertDescription>{signupState.message}</AlertDescription>
                  </Alert>
                )}
                {signupState?.error && (
                  <Alert variant="destructive">
                    <AlertTitle>No se pudo crear la cuenta</AlertTitle>
                    <AlertDescription>{signupState.error}</AlertDescription>
                  </Alert>
                )}

                <form action={signupAction} className="space-y-4">
                  <input type="hidden" name="next" value={nextPath} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre" htmlFor="register-name">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="register-name"
                          name="name"
                          type="text"
                          placeholder="Juan"
                          className="pl-10"
                          autoComplete="given-name"
                          required
                        />
                    </Field>

                    <Field label="Apellido" htmlFor="register-lastname">
                        <Input
                          id="register-lastname"
                          name="lastname"
                          type="text"
                          placeholder="Pérez"
                          className=""
                          autoComplete="family-name"
                          required
                        />
                    </Field>
                  </div>

                  <Field label="Correo electrónico" htmlFor="register-email">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        autoComplete="email"
                        required
                      />
                  </Field>

                  <Field label="Teléfono (opcional)" htmlFor="register-phone">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="register-phone"
                        name="phone"
                        type="tel"
                        placeholder="+54 376 123-4567"
                        className="pl-10"
                        autoComplete="tel"
                      />
                  </Field>

                  <Field label="Contraseña" htmlFor="register-password">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="muted"
                      size="icon-sm"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </Button>
                  </Field>

                  <Field label="Confirmar contraseña" htmlFor="register-confirm-password">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-confirm-password"
                      name="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="muted"
                      size="icon-sm"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar confirmación de contraseña"
                          : "Mostrar confirmación de contraseña"
                      }
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </Button>
                  </Field>

                  <label className="flex items-start gap-2 rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
                    <input type="checkbox" className="mt-0.5 size-4 rounded border-border" required />
                    <span>
                      Acepto los <Link href="/" className="text-primary hover:underline">términos y condiciones</Link> y la{" "}
                      <Link href="/" className="text-primary hover:underline">política de privacidad</Link>.
                    </span>
                  </label>

                  <Button type="submit" className="w-full">
                    Crear cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="relative">{children}</div>
    </div>
  )
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}
