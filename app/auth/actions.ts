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

export async function signup(_prevState: AuthFormState | void, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
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