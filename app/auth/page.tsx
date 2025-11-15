"use client"

import type React from "react"

import { useState, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { login, signup, type AuthFormState } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * Página de autenticación con una interfaz dividida en pestañas para iniciar sesión o registrarse.
 *
 * Renderiza formularios de inicio de sesión y registro, muestra alertas de éxito/error, y permite
 * alternar la visibilidad de las contraseñas. Los formularios envían los datos a las acciones
 * de servidor correspondientes para autenticación y creación de cuenta.
 *
 * @returns El elemento React que renderiza la interfaz de autenticación.
 */
export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // Server Actions (login/signup) are imported and used as form actions.
  const initialState: AuthFormState = { error: undefined, message: undefined }
  const [loginState, loginAction] = useActionState(login, initialState)
  const [signupState, signupAction] = useActionState(signup, initialState)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">PosaCalles</h1>
          <p className="text-slate-600">Únete a la comunidad y ayuda a mejorar nuestra ciudad</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-slate-900">Bienvenido</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Inicia sesión o crea una cuenta para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
        {loginState?.error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error al iniciar sesión</AlertTitle>
          <AlertDescription>Revise por favor sus credenciales</AlertDescription>
                  </Alert>
                )}
        <form action={loginAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span className="text-slate-600">Recordarme</span>
                    </label>
                    <Link href="#" className="text-sm text-emerald-600 hover:text-emerald-700">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <SubmitButton />
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                {signupState?.message && (
                  <Alert>
                    <AlertTitle>Verifica tu correo</AlertTitle>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-sm font-medium text-slate-700">
                        Nombre
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input id="register-name" name="name" type="text" placeholder="Juan" className="pl-10" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-lastname" className="text-sm font-medium text-slate-700">
                        Apellido
                      </Label>
                      <Input id="register-lastname" name="lastname" type="text" placeholder="Pérez" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-medium text-slate-700">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="text-sm font-medium text-slate-700">
                      Teléfono (opcional)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input id="register-phone" type="tel" placeholder="+54 376 123-4567" className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium text-slate-700">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="register-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-sm font-medium text-slate-700">
                      Confirmar contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start space-x-2 text-sm">
                      <input type="checkbox" className="rounded border-slate-300 mt-0.5" required />
                      <span className="text-slate-600">
                        Acepto los{" "}
                        <Link href="#" className="text-emerald-600 hover:text-emerald-700">
                          términos y condiciones
                        </Link>{" "}
                        y la{" "}
                        <Link href="#" className="text-emerald-600 hover:text-emerald-700">
                          política de privacidad
                        </Link>
                      </span>
                    </label>
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Crear Cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-500">
          <p>
            ¿Necesitas ayuda?{" "}
            <Link href="#" className="text-emerald-600 hover:text-emerald-700">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
      {pending ? "Ingresando..." : "Iniciar Sesión"}
    </Button>
  )
}