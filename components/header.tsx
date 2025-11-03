import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { HeaderClient } from "./header-client"

/**
 * Renders the top site header and prepares the current user and display name for the client header.
 *
 * The display name is derived from user metadata (`name`, `full_name`, `first_name`), then the email local-part, and falls back to `"usuario"`.
 *
 * @returns A JSX header element containing site branding and a HeaderClient populated with the current user and the computed display name.
 */
export default async function Header() {
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
        <header className="border-b-4 border-b-primary bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-md">
            <div className="container mx-auto px-1 py-1">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo - Izquierda */}
                    <Link href="/" className="flex items-center gap-3 flex-shrink-0" aria-label="Ir al inicio">
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

                    {/* Navegación Central - Desktop only */}
                    <HeaderClient user={user} displayName={displayName} />
                </div>
            </div>
        </header>
    )
}