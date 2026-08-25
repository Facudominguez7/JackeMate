"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  LogIn,
  LogOut,
  Map,
  Plus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button, buttonVariants } from "@/components/ui/button";
import { signout } from "@/app/auth/actions";

interface HeaderClientProps {
  user: User | null | undefined;
  displayName: string;
  userRolId: number | null;
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function getRouteTitle(pathname: string): string {
  if (pathname.startsWith("/auth")) return "Iniciar sesión";
  if (pathname.startsWith("/reportes/nuevo")) return "Crear reporte";
  if (pathname.startsWith("/reportes")) return "Reportes";
  if (pathname.startsWith("/comunidad")) return "Comunidad";
  if (pathname.startsWith("/dashboard")) return "Mi cuenta";
  return "Reporty";
}

export function HeaderClient({ user }: HeaderClientProps) {
  const pathname = usePathname();
  const isMapRoute = pathname === "/" || pathname.startsWith("/mapa");
  const bottomItems: NavItem[] = [
    { href: "/mapa", label: "Mapa", icon: Map },
    { href: "/reportes", label: "Reportes", icon: List },
    { href: "/reportes/nuevo", label: "Crear", icon: Plus },
    { href: "/comunidad", label: "Comunidad", icon: Users },
    { href: user ? "/dashboard" : "/auth", label: user ? "Cuenta" : "Ingresar", icon: user ? LayoutDashboard : LogIn },
  ];

  const isActive = (href: string) => {
    if (href === "/mapa") return pathname === "/" || pathname.startsWith("/mapa");
    if (href === "/reportes") return pathname.startsWith("/reportes") && !pathname.startsWith("/reportes/nuevo");
    if (href === "/reportes/nuevo") return pathname.startsWith("/reportes/nuevo");
    if (href === "/dashboard") return pathname.startsWith("/dashboard");
    if (href === "/auth") return pathname.startsWith("/auth");
    return pathname === href;
  };

  return (
    <>
      {!isMapRoute && (
        <header className="header-curve sticky top-0 z-40 bg-secondary/[0.87] text-secondary-foreground shadow-sm">
          <div className="relative mx-auto flex min-h-12 w-full max-w-5xl items-center justify-center px-3 py-2 sm:px-4 lg:px-6">
            <h1 className="text-base font-semibold tracking-tight text-secondary-foreground">
              {getRouteTitle(pathname)}
            </h1>
            {user && (
              <form action={signout} className="absolute right-4 sm:right-6 lg:right-8">
                <Button
                  type="submit"
                  variant="neutral"
                  size="icon"
                  aria-label="Cerrar sesión"
                  className="border-0 bg-background text-foreground shadow-sm hover:bg-background/90 focus-visible:ring-primary focus-visible:ring-offset-secondary"
                >
                  <LogOut aria-hidden="true" />
                </Button>
              </form>
            )}
          </div>
        </header>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-secondary-foreground/10 bg-secondary/[0.87] px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 text-secondary-foreground shadow-xl">
          {bottomItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 text-[0.68rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
                  active ? "text-primary" : "text-secondary-foreground/70 hover:text-secondary-foreground"
                }`}
              >
                {href === "/reportes/nuevo" ? (
                  <span className={`${buttonVariants({ variant: "default", size: "icon-lg" })} -mt-6 border-4 border-secondary shadow-xl`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                ) : (
                  <Icon className="size-5" aria-hidden="true" />
                )}
                <span>{label}</span>
              </Link>
            );
          })}
      </nav>
    </>
  );
}
