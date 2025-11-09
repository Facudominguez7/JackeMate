"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Menu,
  ChevronDown,
  Map,
  Plus,
  List,
  Home,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { signout } from "@/app/auth/actions";
import type { User } from "@supabase/supabase-js";

interface HeaderClientProps {
  user: User | null | undefined;
  displayName: string;
  isTransparent?: boolean;
}

/**
 * Cabecera responsiva con navegación (escritorio y móvil) y controles dependientes del estado de usuario.
 *
 * Muestra enlaces de navegación (Inicio, Reportes, Mapa), un menú desplegable de reportes y una hoja lateral para móviles.
 * Cuando hay un usuario autenticado muestra saludo con `displayName`, acceso a "Mi Dashboard" y opción de cerrar sesión;
 * en caso contrario muestra botones para iniciar sesión o registrarse.
 *
 * @param user - Objeto `User` de Supabase o `null`/`undefined`; determina la renderización de las acciones de cuenta
 * @param displayName - Nombre que se muestra cuando el usuario está autenticado
 * @param isTransparent - Si es true, los botones tendrán estilos para fondo transparente
 * @returns El contenido JSX del componente de cabecera con la navegación y los controles de cuenta según el estado de autenticación
 */
export function HeaderClient({ user, displayName, isTransparent = false }: HeaderClientProps) {
  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Centro - Botones de navegación */}
      <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
        {/* Dropdown de Reportes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Reportes <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href="/reportes/nuevo"
                className="cursor-pointer flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/reportes"
                className="cursor-pointer flex items-center"
              >
                <List className="mr-2 h-4 w-4" />
                Ver todos
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Botón del Mapa */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mapa">
            <Map className="mr-2 h-4 w-4" />
            Mapa
          </Link>
        </Button>
      </div>

      {/* Derecha - Auth buttons */}
      <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link" size="sm" className="gap-2 px-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10">
                    {getUserInitials(user.email || "US")}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-2 text-sm">
                <p className="text-muted-foreground text-xs">Hola,</p>
                <p className="font-semibold text-foreground">{displayName}</p>
              </div>
              <div className="border-t my-1" />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard"
                  className="cursor-pointer flex items-center"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Mi Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action={signout} className="w-full">
                  <button
                    type="submit"
                    className="w-full cursor-pointer flex items-center text-destructive hover:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth">Iniciar Sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth">Registrarse</Link>
            </Button>
          </>
        )}
      </div>

      {/* Mobile Navigation - Hamburger Menu */}
      <div className="md:hidden mr-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-6">
              {/* Navigation Links */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Navegación
                </h3>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Inicio
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/reportes/nuevo">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Reporte
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/reportes">
                    <List className="mr-2 h-4 w-4" />
                    Ver Reportes
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/mapa">
                    <Map className="mr-2 h-4 w-4" />
                    Mapa
                  </Link>
                </Button>
              </div>

              {/* Divider */}
              <div className="border-t" />

              {/* Auth Section */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Cuenta
                </h3>
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm rounded-md bg-muted">
                      <p className="text-muted-foreground">
                        Sesión iniciada como:
                      </p>
                      <p className="font-medium text-foreground">
                        {displayName}
                      </p>
                    </div>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Mi Dashboard
                      </Link>
                    </Button>
                    <form action={signout} className="w-full">
                      <Button
                        type="submit"
                        variant="destructive"
                        className="w-full justify-start"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link href="/auth">
                        <LogIn className="mr-2 h-4 w-4" />
                        Iniciar Sesión
                      </Link>
                    </Button>
                    <Button variant="default" className="justify-start" asChild>
                      <Link href="/auth">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Registrarse
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}