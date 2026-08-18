"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  LogIn,
  Map,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
  if (pathname.startsWith("/dashboard")) return "Mi cuenta";
  if (pathname.startsWith("/como-funciona")) return "Cómo funciona";
  return "JackeMate";
}

export function HeaderClient({ user }: HeaderClientProps) {
  const pathname = usePathname();
  const isAppRoute = pathname === "/" || pathname.startsWith("/mapa");

  const bottomItems: NavItem[] = [
    { href: "/mapa", label: "Mapa", icon: Map },
    { href: "/reportes", label: "Reportes", icon: List },
    { href: "/reportes/nuevo", label: "Crear", icon: Plus },
    { href: user ? "/dashboard" : "/auth", label: "Cuenta", icon: user ? LayoutDashboard : LogIn },
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
      {!isAppRoute && (
        <header className="sticky top-0 z-40 bg-[var(--secondary)] text-[var(--secondary-foreground)]">
          <div className="mx-auto flex min-h-[2.75rem] w-full max-w-5xl items-center justify-center px-4 py-1.5 sm:px-6 lg:px-8">
            <h1 className="text-base font-semibold tracking-tight text-[var(--secondary-foreground)]">
              {getRouteTitle(pathname)}
            </h1>
          </div>
        </header>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-secondary-foreground/10 bg-secondary px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 text-secondary-foreground shadow-xl">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-2 text-[0.68rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
                active ? "text-primary" : "text-secondary-foreground/70 hover:text-secondary-foreground"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
