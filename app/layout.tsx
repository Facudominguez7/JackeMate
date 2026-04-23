import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "JackeMate",
  description: "Plataforma ciudadana para reportar problemas urbanos en Posadas, Misiones.",
  icons: {
    icon: [
      {
        url: "/ico/logoJackeMate.png",
        href: "/ico/logoJackeMate.png",
      },
    ],
  },
};

/**
 * Renderiza la estructura raíz HTML de la aplicación incluyendo la cabecera y el contenido de la página.
 *
 * @param children - Contenido React que se renderizará dentro del <body> bajo la cabecera
 * @returns El elemento raíz HTML que envuelve el cuerpo de la aplicación con las fuentes y la cabecera aplicadas
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
