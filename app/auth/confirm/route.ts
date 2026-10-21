/**
 * Confirms the links in Supabase Auth emails (signup, recovery, email change, magic link) by
 * verifying their `token_hash` on the server. Unlike the PKCE callback, it does not need the
 * code verifier cookie, so the link also works when opened on another device or browser.
 */

import { type EmailOtpType } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { obtenerRutaInternaSegura, RUTA_NUEVA_CONTRASENA, RUTA_RECUPERAR_CONTRASENA } from '../rutas-seguras'

/**
 * Resolves where the user goes after confirming. Templates pass either an explicit `next` or
 * Supabase's `redirect_to` (the `/auth/callback?next=...` URL the app requested), whose `next`
 * is reused. Only internal paths are accepted.
 */
function obtenerDestino(searchParams: URLSearchParams, type: EmailOtpType | null) {
  const fallback = type === 'recovery' ? RUTA_NUEVA_CONTRASENA : undefined
  const next = searchParams.get('next')

  if (next !== null) {
    return obtenerRutaInternaSegura(next, fallback)
  }

  try {
    const redirectTo = new URL(searchParams.get('redirect_to') ?? '')
    return obtenerRutaInternaSegura(redirectTo.searchParams.get('next'), fallback)
  } catch {
    return obtenerRutaInternaSegura(null, fallback)
  }
}

/**
 * Verifies the email OTP and redirects to a safe internal page. An expired or reused link goes
 * back to the recovery form or to sign in, never to a missing page.
 *
 * @param request - Request with `token_hash`, `type` and optionally `next` or `redirect_to`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const destino = obtenerDestino(searchParams, type)

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      revalidatePath('/', 'layout')
      redirect(destino)
    }
  }

  if (type === 'recovery' || destino === RUTA_NUEVA_CONTRASENA) {
    redirect(`${RUTA_RECUPERAR_CONTRASENA}?error=enlace`)
  }

  redirect(`/auth?error=enlace&next=${encodeURIComponent(destino)}`)
}
