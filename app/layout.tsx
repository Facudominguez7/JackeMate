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
