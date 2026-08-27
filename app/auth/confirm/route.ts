/**
 * Callback de confirmación por OTP para mantener el flujo de email existente.
 */

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { obtenerRutaInternaSegura } from '../rutas-seguras'

/**
 * Verifica el token OTP de Supabase y redirige solamente a rutas internas seguras.
 *
 * @param request - Petición entrante con `token_hash`, `type` y opcionalmente `next`.
 * @returns Redirección al destino seguro o a una pantalla de error controlada.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = obtenerRutaInternaSegura(searchParams.get('next'))

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirect(next)
    }
  }

  redirect('/error')
}
