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

  return <HeaderClient user={user} displayName={displayName} userRolId={userRolId} />
}
