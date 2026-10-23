import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { gaIdFromEnv } from "@/lib/analytics/google-analytics";

const gaId = gaIdFromEnv(process.env.NEXT_PUBLIC_GA_ID);

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Reporty",
  description: "Plataforma ciudadana para reportar problemas urbanos en Posadas, Misiones.",
  icons: {
    icon: [
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon.ico" },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
  },
  manifest: "/favicon_io/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className={`flex min-h-dvh flex-col font-sans ${GeistSans.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="main-content" className="app-main">{children}</main>
        <Toaster richColors position="top-center" />
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
