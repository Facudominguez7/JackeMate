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
 * Root-level layout component that applies global fonts, renders the site header, and wraps page content.
 *
 * @param children - React nodes to be rendered as the page content within the layout
 * @returns The top-level HTML structure containing the header and the provided children
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