import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobFlow",
  description:
    "Personnel management system for Broers Verhuur, DCRT Event Decorations, and DCRT in Building",
  keywords: [
    "personnel management",
    "time tracking",
    "project management",
    "scheduling",
  ],
  authors: [{ name: "JobFlow Team" }],
  creator: "JobFlow",
  publisher: "JobFlow",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JobFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${inter.className} touch-manipulation`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
