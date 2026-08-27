/**
 * Callback OAuth PKCE de Supabase Auth para intercambiar el código por sesión.
 */

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { type NextRequest } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { obtenerRutaInternaSegura } from "../rutas-seguras"

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

  redirect(`/auth?error=oauth&next=${encodeURIComponent(next)}`)
}
