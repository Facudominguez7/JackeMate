"use server"

/**
 * Acciones de servidor para iniciar, crear y cerrar sesiones de autenticación.
 */

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { isAnonymousUser } from "@/lib/authz/roles"
import { createClient } from "@/utils/supabase/server"
import { obtenerOrigenAutenticacion, obtenerRutaInternaSegura } from "./rutas-seguras"

export type AuthFormState = {
  error?: string
  message?: string
}

type ProveedorOAuth = "google"

const emailSchema = z.string().trim().toLowerCase().email().max(254)

/** Internal destination after a guest verifies the email linked to their account. */
const RUTA_CUENTA_VINCULADA = "/mis-reportes?cuenta=vinculada"

/**
 * Builds the Supabase Auth redirect URL that lands on the PKCE callback route.
 *
 * @param next - Internal route to open once the session is exchanged.
 */
async function obtenerRedireccionCallback(next: string) {
  const cabeceras = await headers()
  const redirectTo = new URL("/auth/callback", obtenerOrigenAutenticacion(cabeceras))
  redirectTo.searchParams.set("next", next)
  return redirectTo.toString()
}

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

/**
 * Links an email to the current anonymous (guest) identity with `updateUser`, which
 * keeps the same `auth.users.id`, so every guest report stays attached. Supabase sends a
 * verification email; the account only becomes permanent (and the DB trigger promotes
 * the guest role to ciudadano) after the user opens that link.
 *
 * `signUp()` is intentionally not used: it would create a different identity.
 * If the email already belongs to an account nothing is merged or reassigned.
 *
 * @param _prevState - Previous form state.
 * @param formData - FormData with `email`.
 * @returns Form state with a confirmation message or a controlled error.
 */
export async function vincularCorreoInvitado(
  _prevState: AuthFormState | void,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailSchema.safeParse(formData.get("email"))

  if (!email.success) {
    return { error: "Ingresá un correo electrónico válido." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No encontramos tu sesión de invitado en este navegador." }
  }

  if (!isAnonymousUser(user)) {
    return { error: "Tu cuenta ya está guardada con un correo electrónico." }
  }

  const { error } = await supabase.auth.updateUser(
    { email: email.data },
    { emailRedirectTo: await obtenerRedireccionCallback(RUTA_CUENTA_VINCULADA) },
  )

  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists" || /already/i.test(error.message)) {
      return {
        error:
          "Ese correo ya pertenece a una cuenta de Reporty. Podés iniciar sesión con esa cuenta, pero los reportes hechos como invitado no se transfieren automáticamente.",
      }
    }

    if (error.status === 429) {
      return { error: "Enviamos demasiados correos. Probá de nuevo en unos minutos." }
    }

    return { error: "No pudimos enviar el correo de verificación. Intentá nuevamente." }
  }

  revalidatePath("/mis-reportes")
  return {
    message: `Te enviamos un enlace a ${email.data}. Abrilo desde este mismo navegador para terminar de guardar tu cuenta.`,
  }
}

/**
 * Sends a passwordless sign-in link (email OTP) to an existing account. It never creates
 * users and answers the same way whether the account exists or not.
 *
 * @param _prevState - Previous form state.
 * @param formData - FormData with `email` and optionally `next`.
 * @returns Form state with a neutral confirmation message or a controlled error.
 */
export async function enviarEnlaceAcceso(
  _prevState: AuthFormState | void,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailSchema.safeParse(formData.get("email"))

  if (!email.success) {
    return { error: "Ingresá un correo electrónico válido." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: await obtenerRedireccionCallback(obtenerSiguienteRutaSegura(formData)),
    },
  })

  if (error?.status === 429) {
    return { error: "Enviamos demasiados correos. Probá de nuevo en unos minutos." }
  }

  return {
    message: "Si existe una cuenta con ese correo, te enviamos un enlace para ingresar. Abrilo desde este mismo navegador.",
  }
}
