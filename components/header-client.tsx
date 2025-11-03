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
}

/**
 * Render a responsive header with navigation links and authentication controls.
 *
 * Renders a desktop layout with a reports dropdown, map link, and auth actions, and a mobile sheet menu with the same navigation and account controls.
 *
 * @param user - The authenticated user object, or `null`/`undefined` when not signed in.
 * @param displayName - The display name shown in greetings and account sections when a user is signed in.
 * @returns The JSX element for the responsive header UI. 
 */
export function HeaderClient({ user, displayName }: HeaderClientProps) {
  return (
    <>
      {/* Desktop Navigation - 3 columns layout */}
      <div className="hidden md:flex items-center justify-between flex-1 gap-4">
        {/* Centro - Botones de navegación */}
        <div className="flex items-center gap-3 mx-auto">
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
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                Hola,{" "}
                <span className="font-medium text-foreground">
                  {displayName}
                </span>
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Mi Dashboard</Link>
              </Button>
              <form action={signout}>
                <Button variant="destructive" type="submit" size="sm">
                  Cerrar sesión
                </Button>
              </form>
            </>
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