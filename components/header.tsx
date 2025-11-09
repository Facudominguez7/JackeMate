import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { HeaderClient } from "./header-client"
import { HeaderWrapper } from "./header-wrapper"

/**
 * Renderiza el encabezado de la aplicación con logo y controles de usuario.
 *
 * Recupera el usuario autenticado desde Supabase, determina un `displayName`
 * a partir de la metadata del usuario o de la parte local del correo y devuelve
 * la estructura JSX del header que incluye el logo responsive y el componente
 * `HeaderClient` con el usuario y su nombre para mostrar.
 *
 * @param isTransparent - Si es true, el header será transparente (para la página de inicio)
 * @returns El elemento JSX del encabezado de la página que contiene el logo, el título responsive y el componente `HeaderClient` configurado con el usuario y `displayName`.
 */
export default async function Header({ isTransparent = false }: { isTransparent?: boolean }) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    const displayName =
        (user?.user_metadata as Record<string, any> | undefined)?.name ||
        (user?.user_metadata as Record<string, any> | undefined)?.full_name ||
        (user?.user_metadata as Record<string, any> | undefined)?.first_name ||
        user?.email?.split("@")[0] ||
        "usuario"

    return (
        <HeaderWrapper isTransparent={isTransparent}>
            <div className="container mx-auto px-1 py-1">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo - Izquierda */}
                    <div className="flex-1">
                        <Link href="/" className="flex items-center gap-3 flex-shrink-0 w-fit" aria-label="Ir al inicio">
                            <div className="w-20 h-20 rounded-lg relative overflow-hidden">
                                <Image
                                    src="/logo/logoJackeMate.png"
                                    alt="JackeMate logo"
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <div className="hidden lg:block">
                                <h1 className="text-xl font-bold text-foreground">JackeMate</h1>
                                <p className="text-sm text-muted-foreground">Mejoremos nuestra ciudad juntos</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navegación Central y Derecha */}
                    <HeaderClient user={user} displayName={displayName} isTransparent={isTransparent} />
                </div>
            </div>
        </HeaderWrapper>
    )
}