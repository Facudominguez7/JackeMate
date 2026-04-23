import Link from "next/link"
import Image from "next/image"
import { getUserRoleContext } from "@/lib/authz/roles"
import { getUserDisplayName } from "@/lib/identity/display"
import { createClient } from "@/utils/supabase/server"
import { HeaderClient } from "./header-client"

/**
 * Renderiza el encabezado de la aplicación con el logotipo y los controles de usuario.
 *
 * Incluye un logotipo responsive, el título visible en pantallas grandes y los controles de usuario en la zona derecha.
 *
 * @returns El elemento JSX del encabezado que contiene el logotipo, el título responsive y los controles de usuario.
 */
export default async function Header() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  const displayName = getUserDisplayName(user)

  let userRolId: number | null = null
  if (user) {
    const { data: roleContext } = await getUserRoleContext(supabase, user.id)
    userRolId = roleContext?.roleId ?? null
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="page-container">
        <div className="flex min-h-18 items-center justify-between gap-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ir al inicio">
            <div className="relative size-11 overflow-hidden rounded-2xl border border-border bg-[var(--surface-subtle)]">
              <Image
                src="/logo/logoJackeMate.png"
                alt="JackeMate logo"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight">JackeMate</p>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Reportes ciudadanos para Posadas, Misiones
              </p>
            </div>
          </Link>

          <HeaderClient user={user} displayName={displayName} userRolId={userRolId} />
        </div>
      </div>
    </header>
  )
}
