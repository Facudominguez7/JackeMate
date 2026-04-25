"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { isAnonymousUser } from "@/lib/authz/anonymous"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

export type AuthFormState = {
  error?: string
  message?: string
  email?: string
  necesitaVerificacion?: boolean
}

export async function login(_prevState: AuthFormState | void, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Supabase devuelve el mismo error genérico ("Invalid login credentials") tanto
    // para password incorrecto como para email sin confirmar (anti-enumeración).
    // Verificamos con la RPC privada (service_role) para customizar el mensaje cuando aplica.
    try {
      const admin = createAdminClient()
      const { data: estado } = await admin.rpc("estado_confirmacion_email", {
        email_input: data.email,
      })
      const fila = Array.isArray(estado) ? estado[0] : estado
      if (fila?.existe && !fila.email_confirmado) {
        return {
          error: "Tu correo electrónico no está verificado. Confirmá el enlace que te enviamos para poder iniciar sesión.",
          email: data.email,
          necesitaVerificacion: true,
        }
      }
    } catch {
      // Si la verificación admin falla, caemos al mensaje genérico — nunca bloqueamos el flow.
    }
    return { error: error.message || "Credenciales inválidas" }
  }

  revalidatePath("/", "layout")
  redirect("/")
  // Unreachable, but satisfies return type for TypeScript
  return {}
}

/**
 * Registra un nuevo usuario o completa una cuenta anónima existente usando los campos del formulario.
 *
 * @param _prevState - Estado anterior del formulario (no utilizado).
 * @param formData - FormData que debe contener los campos `name`, `lastname`, `email` y `password`.
 * @returns Un objeto `AuthFormState` que contiene:
 *  - `error`: mensaje de error si la creación de la cuenta falla,
 *  - `message`: instrucción para confirmar el correo si se requiere verificación,
 *  - o un objeto vacío en caso de que la sesión se cree y se redirija al inicio.
 * Además, si detecta una sesión anónima activa, enlaza email+password al mismo usuario para preservar el historial
 * (reportes, comentarios y actividad) y luego redirige a `/`.
 */
export async function signup(_prevState: AuthFormState | void, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
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

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (isAnonymousUser(currentUser)) {
    const { data: updatedData, error } = await supabase.auth.updateUser({
      email: data.email,
      password,
      data: data.options.data,
    })

    if (error) {
      return { error: error.message || 'No pudimos completar tu cuenta.' }
    }

    if (isAnonymousUser(updatedData.user)) {
      return {
        message:
          'Te enviamos un correo para confirmar tu cuenta. Hasta confirmar ese enlace, tu sesión sigue como invitado y no vas a poder usar el dashboard.',
        email: data.email,
      }
    }

    revalidatePath('/', 'layout')
    redirect('/')
    return {}
  }

  const { data: signUpData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message || 'No se pudo crear la cuenta' }
  }

  // If email confirmation is enabled, session will be null and Supabase will send a verification email.
  if (!signUpData?.session) {
    return {
      message:
        'Te enviamos un correo de confirmación. Revisa tu bandeja de entrada y sigue el enlace para activar tu cuenta.',
      email: data.email,
    }
  }

  // If a session is returned (confirmation disabled), log in and redirect.
  revalidatePath('/', 'layout')
  redirect('/')
  return {}
}

/**
 * Reenvía el correo de confirmación para una cuenta pendiente de activación.
 *
 * @param _prevState - Estado anterior del formulario (no utilizado).
 * @param formData - FormData que debe contener el campo `email`.
 * @returns `{ message }` si el reenvío fue exitoso, `{ error }` si falló.
 */
export async function reenviarEmailConfirmacion(_prevState: AuthFormState | void, formData: FormData): Promise<AuthFormState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'No se encontró el email para reenviar la confirmación.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })

  if (error) {
    return { error: error.message || 'No pudimos reenviar el correo de confirmación.' }
  }

  return { message: 'Te reenviamos el correo de confirmación. Revisá tu bandeja de entrada.' }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
