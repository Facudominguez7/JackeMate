"use client"

import type React from "react"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, MailCheck, Phone, User } from "lucide-react"

import { login, signup, reenviarEmailConfirmacion, type AuthFormState } from "./actions"
import { createClient } from "@/utils/supabase/client"
import { isAnonymousUser } from "@/lib/authz/anonymous"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Renderiza la pantalla de autenticación con tabs de ingreso y registro.
 *
 * También soporta el modo `completar-cuenta` para convertir una sesión anónima
 * en cuenta permanente sin perder historial de actividad.
 */
export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const initialState: AuthFormState = { error: undefined, message: undefined }
  const [loginState, loginAction] = useActionState(login, initialState)
  const [signupState, signupAction] = useActionState(signup, initialState)
  const [resendState, resendAction] = useActionState(reenviarEmailConfirmacion, initialState)
  const [emailPendiente, setEmailPendiente] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const modo = searchParams.get("modo")
  const esModoCompletarCuenta = modo === "completar-cuenta"

  useEffect(() => {
    if (!esModoCompletarCuenta) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email_confirmed_at) return
      // Cubre dos casos: autenticado con email sin confirmar, y anónimo que ya configuró email pero no confirmó
      const tieneEmailPendiente = !isAnonymousUser(user) || (isAnonymousUser(user) && !!user.email)
      if (tieneEmailPendiente) {
        setEmailPendiente(user.email ?? null)
      }
    })
  }, [esModoCompletarCuenta])

  return (
    <div className="page-shell">
      <div className="page-container py-6 md:py-8 lg:py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <section className="rounded-[var(--radius-xl)] border border-border bg-[var(--surface-subtle)] p-6 md:p-8 lg:p-10">
            <div className="section-stack">
              <span className="section-eyebrow">Acceso ciudadano</span>
              <h1 className="section-title">Ingresá para crear, seguir y gestionar reportes.</h1>
              <p className="section-copy max-w-none">
                La experiencia de autenticación mantiene el mismo lenguaje visual del producto: simple, sobria y enfocada en la tarea. Sin distracciones. Sin adornos innecesarios.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
                <p className="text-sm font-medium">Crear reportes</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Registrá incidentes con ubicación y evidencia.</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
                <p className="text-sm font-medium">Hacer seguimiento</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Consultá estados, comentarios y cambios del reporte.</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
                <p className="text-sm font-medium">Participar con criterio</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Votá, comentá y ayudá a mantener información confiable.</p>
              </div>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Tu cuenta JackeMate</CardTitle>
              <CardDescription>
                {esModoCompletarCuenta
                  ? "Completá tu cuenta para recibir notificaciones y votar reportes."
                  : "Usá una sola interfaz para ingresar o registrarte."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {esModoCompletarCuenta ? (
                <Alert className="mb-4">
                  <AlertTitle>¡Tu reporte ya fue creado!</AlertTitle>
                  <AlertDescription>
                    Ahora terminá tu cuenta para poder seguir estados, recibir notificaciones y votar.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Tabs defaultValue={esModoCompletarCuenta ? "register" : "login"} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Ingresar</TabsTrigger>
                  <TabsTrigger value="register">{esModoCompletarCuenta ? "Completar cuenta" : "Registrarme"}</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-5 pt-2">
                  {loginState?.necesitaVerificacion && loginState?.email ? (
                    <PantallaEmailPendiente
                      email={loginState.email}
                      resendAction={resendAction}
                      resendState={resendState}
                      fromLogin
                    />
                  ) : (
                  <>
                  {loginState?.error && (
                    <Alert variant="destructive">
                      <AlertTitle>Error al iniciar sesión</AlertTitle>
                      <AlertDescription>{loginState.error}</AlertDescription>
                    </Alert>
                  )}

                  <form action={loginAction} className="space-y-4">
                    <Field label="Correo electrónico" htmlFor="login-email">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="login-email" name="email" type="email" placeholder="tu@email.com" className="pl-10" autoComplete="email" required />
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
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </Field>

                    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="size-4 rounded border-border" />
                        Recordarme
                      </label>
                      <Link href="mailto:hola@jackemate.app" className="text-primary hover:underline">
                        Recuperar acceso
                      </Link>
                    </div>

                    <SubmitButton label="Ingresar" pendingLabel="Ingresando..." />
                  </form>
                  </>
                  )}
                </TabsContent>

                <TabsContent value="register" className="space-y-5 pt-2">
                  {(signupState?.message && esModoCompletarCuenta) || emailPendiente ? (
                    <PantallaEmailPendiente
                      email={signupState?.email ?? emailPendiente}
                      resendAction={resendAction}
                      resendState={resendState}
                    />
                  ) : (
                    <>
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
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Nombre" htmlFor="register-name">
                            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input id="register-name" name="name" type="text" placeholder="Juan" className="pl-10" autoComplete="given-name" required />
                          </Field>

                          <Field label="Apellido" htmlFor="register-lastname">
                            <Input id="register-lastname" name="lastname" type="text" placeholder="Pérez" autoComplete="family-name" required />
                          </Field>
                        </div>

                        <Field label="Correo electrónico" htmlFor="register-email">
                          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="register-email" name="email" type="email" placeholder="tu@email.com" className="pl-10" autoComplete="email" required />
                        </Field>

                        <Field label="Teléfono (opcional)" htmlFor="register-phone">
                          <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="register-phone" name="phone" type="tel" placeholder="+54 376 123-4567" className="pl-10" autoComplete="tel" />
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
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
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
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </Field>

                        <label className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-border bg-[var(--surface-subtle)] p-4 text-sm text-muted-foreground">
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
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
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

function PantallaEmailPendiente({
  email,
  resendAction,
  resendState,
  fromLogin = false,
}: {
  email: string | null
  resendAction: (formData: FormData) => void
  resendState: AuthFormState
  fromLogin?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-[var(--surface-subtle)]">
        <MailCheck className="size-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">Revisá tu correo</h3>
        {email && <p className="text-sm font-medium">{email}</p>}
        <p className="text-sm text-muted-foreground">
          Te enviamos un link de confirmación. Hacé click en él para activar tu cuenta y acceder al dashboard.
        </p>
        <p className="text-xs text-muted-foreground">
          {fromLogin
            ? "Una vez confirmado, vas a poder ingresar normalmente."
            : "Hasta confirmar, tu sesión sigue como invitado."}
        </p>
      </div>
      {resendState?.message && (
        <Alert className="w-full text-left">
          <AlertDescription>{resendState.message}</AlertDescription>
        </Alert>
      )}
      {resendState?.error && (
        <Alert variant="destructive" className="w-full text-left">
          <AlertDescription>{resendState.error}</AlertDescription>
        </Alert>
      )}
      <form action={resendAction} className="w-full">
        <input type="hidden" name="email" value={email ?? ""} />
        <SubmitButton label="Reenviar correo" pendingLabel="Reenviando..." />
      </form>
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
