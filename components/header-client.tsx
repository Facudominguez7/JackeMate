"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  ChevronDown,
  Home,
  LayoutDashboard,
  List,
  LogIn,
  LogOut,
  Map,
  Menu,
  Plus,
  UserPlus,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { signout } from "@/app/auth/actions";
import { canCreateReports } from "@/lib/authz/roles";
import { getUserInitials } from "@/lib/identity/display";

interface HeaderClientProps {
  user: User | null | undefined;
  displayName: string;
  userRolId: number | null;
}

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

export function HeaderClient({ user, displayName, userRolId }: HeaderClientProps) {
  const puedeCrearReportes = canCreateReports(userRolId);

  const items: NavItem[] = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/reportes", label: "Reportes", icon: List },
    { href: "/mapa", label: "Mapa", icon: Map },
  ];

  if (user && puedeCrearReportes) {
    items.push({ href: "/reportes/nuevo", label: "Nuevo reporte", icon: Plus });
  }

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex">
        {items.map(({ href, label }) => (
          <Button key={href} variant="ghost" size="sm" asChild>
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </nav>

      <div className="hidden items-center gap-3 lg:flex">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 pr-3">
                <Avatar className="size-8 border border-border">
                  <AvatarFallback className="bg-[var(--surface-subtle)] text-xs font-semibold text-foreground">
                    {getUserInitials(user.email || "US")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <p className="max-w-32 truncate text-sm font-medium">{displayName}</p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-[var(--radius-lg)]">
              <div className="space-y-1 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Sesión activa
                </p>
                <p className="truncate text-sm font-medium">{displayName}</p>
                {puedeCrearReportes && <Badge variant="secondary">Ciudadanía activa</Badge>}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="size-4" />
                  Mi dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/reportes" className="flex items-center gap-2">
                  <List className="size-4" />
                  Ver reportes
                </Link>
              </DropdownMenuItem>
              {puedeCrearReportes && (
                <DropdownMenuItem asChild>
                  <Link href="/reportes/nuevo" className="flex items-center gap-2">
                    <Plus className="size-4" />
                    Crear reporte
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signout} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2 text-left text-destructive">
                    <LogOut className="size-4" />
                    Cerrar sesión
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth">Ingresar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth">Crear cuenta</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Abrir menú">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(22rem,calc(100vw-1rem))] border-l border-border bg-background p-0 sm:w-[22rem]">
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 px-6 py-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Navegación
                </p>
                {items.map(({ href, label, icon: Icon }) => (
                  <Button key={href} variant="ghost" className="w-full justify-start" asChild>
                    <Link href={href}>
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Cuenta
                </p>
                {user ? (
                  <>
                    <div className="rounded-[var(--radius-lg)] border border-border bg-[var(--surface-subtle)] p-4">
                      <p className="text-sm text-muted-foreground">Ingresaste como</p>
                      <p className="mt-1 text-base font-medium">{displayName}</p>
                    </div>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="size-4" />
                        Mi dashboard
                      </Link>
                    </Button>
                    <form action={signout} className="w-full">
                      <Button type="submit" variant="destructive" className="w-full justify-start">
                        <LogOut className="size-4" />
                        Cerrar sesión
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/auth">
                        <LogIn className="size-4" />
                        Ingresar
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" asChild>
                      <Link href="/auth">
                        <UserPlus className="size-4" />
                        Crear cuenta
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
