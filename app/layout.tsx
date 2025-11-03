import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "JackeMate",
  description: "Created by Facundo y Octavio",
  icons: {
  icon: [
    {
      url: "/ico/logoJackeMate.png",
      href: "/ico/logoJackeMate.png",
    }
  ],
}
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
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}