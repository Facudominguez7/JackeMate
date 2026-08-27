"use server"

/**
 * Acciones de servidor para iniciar, crear y cerrar sesiones de autenticación.
 */

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"
import { obtenerOrigenAutenticacion, obtenerRutaInternaSegura } from "./rutas-seguras"

export type AuthFormState = {
  error?: string
  message?: string
}

type ProveedorOAuth = "google"

/**
 * Obtiene una ruta interna segura desde el formulario de autenticación.
 *
 * @param formData - FormData que puede incluir el campo `next`.
 * @returns Ruta interna validada para redirigir dentro de la aplicación.
 */
const obtenerSiguienteRutaSegura = (formData: FormData) => obtenerRutaInternaSegura(formData.get("next"))

/**
 * Valida que el proveedor OAuth enviado desde la UI esté permitido por la app.
 *
 * @param proveedor - Valor recibido desde el formulario OAuth.
 * @returns Proveedor OAuth soportado o `null` cuando el valor no es seguro.
 */
const obtenerProveedorOAuth = (proveedor: FormDataEntryValue | null): ProveedorOAuth | null => {
  if (proveedor === "google") {
    return proveedor
  }

  return null
}

/**
 * Inicia sesión con correo y contraseña conservando un destino interno seguro.
 *
 * @param _prevState - Estado anterior del formulario.
 * @param formData - FormData con `email`, `password` y opcionalmente `next`.
 * @returns Estado con error controlado o redirección al destino seguro.
 */
export async function login(_prevState: AuthFormState | void, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message || "Credenciales inválidas" }
  }

  revalidatePath("/", "layout")
  redirect(obtenerSiguienteRutaSegura(formData))
  return {}
}

/**
 * Inicia el flujo OAuth de Supabase para Google desde el servidor.
 *
 * @param formData - FormData con `provider` y opcionalmente `next`.
 * @returns Redirección a Supabase o al formulario con error controlado.
 */
export async function iniciarSesionOAuth(formData: FormData): Promise<void> {
  const proveedor = obtenerProveedorOAuth(formData.get("provider"))
  const next = obtenerSiguienteRutaSegura(formData)

  if (!proveedor) {
    redirect(`/auth?error=oauth&next=${encodeURIComponent(next)}`)
  }

  const cabeceras = await headers()
  const redirectTo = new URL("/auth/callback", obtenerOrigenAutenticacion(cabeceras))
  redirectTo.searchParams.set("next", next)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: proveedor,
    options: {
      redirectTo: redirectTo.toString(),
    },
  })

  if (error || !data.url) {
    redirect(`/auth?error=oauth&next=${encodeURIComponent(next)}`)
  }

  redirect(data.url)
}

/**
 * Registra un nuevo usuario usando los campos del formulario y gestiona la navegación tras el registro.
 *
 * @param _prevState - Estado anterior del formulario (no utilizado).
 * @param formData - FormData que debe contener los campos `name`, `lastname`, `email` y `password`.
 * @returns Un objeto `AuthFormState` que contiene:
 *  - `error`: mensaje de error si la creación de la cuenta falla,
 *  - `message`: instrucción para confirmar el correo si se requiere verificación,
 *  - o un objeto vacío en caso de que la sesión se cree y se redirija al inicio.
 * Además, si el registro crea una sesión activa, la función revalida la caché del layout raíz y redirige a `/`.
 */
export async function signup(_prevState: AuthFormState | void, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const lastname = formData.get('lastname') as string
  const phone = (formData.get('phone') as string | null)?.trim() ?? ''
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string
  const displayName = `${name} ${lastname}`.trim()

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }
  
  const data = {
    email: formData.get('email') as string,
    password,
    options: {
      data: {
        display_name: displayName,
        name: name,
        lastname: lastname,
        phone: phone || undefined,
      }
    }
  }

  const { data: signUpData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message || 'No se pudo crear la cuenta' }
  }

  if (!signUpData?.session) {
    return {
      message:
        'Te enviamos un correo de confirmación. Revisa tu bandeja de entrada y sigue el enlace para activar tu cuenta.',
    }
  }

  revalidatePath('/', 'layout')
  redirect(obtenerSiguienteRutaSegura(formData))
  return {}
}

/**
 * Cierra la sesión actual y refresca el layout autenticado.
 *
 * @returns Redirección a la página inicial tras cerrar sesión.
 */
export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
