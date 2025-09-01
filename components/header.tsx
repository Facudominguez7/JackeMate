import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { signout } from "@/app/auth/actions"

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
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3" aria-label="Ir al inicio">
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
                        <div>
                            <h1 className="text-xl font-bold text-foreground">JackeMate</h1>
                            <p className="text-sm text-muted-foreground">Mejoremos nuestra ciudad juntos</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {user ? (
                            <>
                                <span className="hidden sm:inline text-sm text-muted-foreground">Hola, <span className="font-medium text-foreground">{displayName}</span></span>
                                <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                                    <Link href="/dashboard">Mi Dashboard</Link>
                                </Button>
                                <form action={signout}>
                                    <Button type="submit" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                                        Cerrar sesión
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3" asChild>
                                    <Link href="/auth">
                                        <span className="hidden sm:inline">Iniciar Sesión</span>
                                        <span className="sm:hidden">Entrar</span>
                                    </Link>
                                </Button>
                                <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3" asChild>
                                    <Link href="/auth">
                                        <span className="hidden sm:inline">Registrarse</span>
                                        <span className="sm:hidden">Registro</span>
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
