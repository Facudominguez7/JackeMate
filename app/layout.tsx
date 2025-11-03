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
 * Root layout component that wraps pages with the outer HTML and body structure and includes the site header.
 *
 * @param children - React nodes to render inside the page body; they are placed after the header.
 * @returns The top-level HTML element containing the document body, site header, and the provided children.
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