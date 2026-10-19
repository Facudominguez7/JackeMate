/**
 * Callback OAuth PKCE de Supabase Auth para intercambiar el código por sesión.
 */

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { type NextRequest } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { obtenerRutaInternaSegura, RUTA_NUEVA_CONTRASENA, RUTA_RECUPERAR_CONTRASENA } from "../rutas-seguras"

/**
 * Completa el flujo OAuth intercambiando el `code` por una sesión y usando un `next` seguro.
 *
 * @param request - Petición de Supabase Auth con `code` y opcionalmente `next`.
 * @returns Redirección al destino interno seguro o al formulario con error controlado.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = obtenerRutaInternaSegura(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      revalidatePath("/", "layout")
      redirect(next)
    }
  }

  // An expired or reused recovery link goes back to the recovery form, not to the OAuth error.
  if (next === RUTA_NUEVA_CONTRASENA) {
    redirect(`${RUTA_RECUPERAR_CONTRASENA}?error=enlace`)
  }

  redirect(`/auth?error=oauth&next=${encodeURIComponent(next)}`)
}
