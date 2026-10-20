"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  List,
  LogIn,
  Map,
  Plus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { buttonVariants } from "@/components/ui/button";
import { needsPasswordSetup } from "@/lib/authz/guest-account";

interface HeaderClientProps {
  user: User | null | undefined;
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Last nav slot: visitors sign in, guests open their reports, permanent users their account. */
function getAccountNavItem(user: User | null | undefined): NavItem {
  if (!user) {
    return { href: "/auth", label: "Ingresar", icon: LogIn };
  }

  // Guests and converted guests that still have to create their password land on "Mis reportes".
  if (user.is_anonymous || needsPasswordSetup(user)) {
    return { href: "/mis-reportes", label: "Mis reportes", icon: FileText };
  }

  return { href: "/dashboard", label: "Cuenta", icon: LayoutDashboard };
}

export function HeaderClient({ user }: HeaderClientProps) {
  const pathname = usePathname();
  const bottomItems: NavItem[] = [
    { href: "/mapa", label: "Mapa", icon: Map },
    { href: "/reportes", label: "Reportes", icon: List },
    { href: "/reportes/nuevo", label: "Crear", icon: Plus },
    { href: "/comunidad", label: "Comunidad", icon: Users },
    getAccountNavItem(user),
  ];

  const showTopHeader = pathname !== "/" && pathname !== "/mapa" && !pathname.startsWith("/auth");

  const isActive = (href: string) => {
    if (href === "/mapa") return pathname === "/" || pathname.startsWith("/mapa");
    if (href === "/reportes") return pathname.startsWith("/reportes") && !pathname.startsWith("/reportes/nuevo");
    if (href === "/reportes/nuevo") return pathname.startsWith("/reportes/nuevo");
    if (href === "/dashboard") return pathname.startsWith("/dashboard");
    if (href === "/auth") return pathname.startsWith("/auth");
    if (href === "/mis-reportes") return pathname.startsWith("/mis-reportes");
    return pathname === href;
  };

  return (
    <>
      {showTopHeader && <div className="h-[calc(9rem+env(safe-area-inset-top))] shrink-0" aria-hidden="true" />}
      {showTopHeader && (
        <header className="app-header fixed inset-x-0 top-0 z-40 flex min-h-[9rem] items-end justify-center border-b border-secondary-foreground/10 px-4 pb-4 pt-[env(safe-area-inset-top)] shadow-xl sm:px-6">
          <Link href="/mapa" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary" aria-label="Reporty, ir al mapa">
            <Image
              src="/logos/logoBlanco.webp"
              alt="Reporty"
              width={136}
              height={40}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>
        </header>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-secondary-foreground/10 bg-secondary/[0.92] px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 text-secondary-foreground shadow-xl backdrop-blur-sm sm:px-3">
          {bottomItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-1 text-[0.64rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
                  active ? "text-primary" : "text-secondary-foreground/70 hover:text-secondary-foreground"
                }`}
              >
                {href === "/reportes/nuevo" ? (
                  <span className={`${buttonVariants({ variant: "default", size: "icon-lg" })} -mt-3 size-10 border-2 border-secondary shadow-xl`}>
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                ) : (
                  <Icon className="size-4.5" aria-hidden="true" />
                )}
                <span>{label}</span>
              </Link>
            );
          })}
      </nav>
    </>
  );
}
