"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"

export type AuthFormState = {
  error?: string
  message?: string
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
    // Inline error: return a message instead of redirecting
    return { error: error.message || "Credenciales inválidas" }
  }

  revalidatePath("/", "layout")
  redirect("/")
  // Unreachable, but satisfies return type for TypeScript
  return {}
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

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const name = formData.get('name') as string
  const lastname = formData.get('lastname') as string
  const displayName = `${name} ${lastname}`.trim()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        display_name: displayName,
        name: name,
        lastname: lastname,
      }
    }
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
    }
  }

  // If a session is returned (confirmation disabled), log in and redirect.
  revalidatePath('/', 'layout')
  redirect('/')
  return {}
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}