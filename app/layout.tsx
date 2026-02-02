import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { brandConfig } from "@/lib/brandConfig";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Base URL for metadata. Replace with production domain when available.
 */
export const metadataBase = new URL(brandConfig.siteUrl);

/**
 * Global metadata for the entire site.
 * Includes Open Graph, Twitter Card, icons, and theme color.
 */
export const metadata: Metadata = {
  metadataBase,
  title: {
    default: `${brandConfig.brandName} | ${brandConfig.tagline}`,
    template: `%s | ${brandConfig.brandName}`,
  },
  description: `${brandConfig.tagline}. Premium products. Envíos nacionales disponibles.`,
  keywords: ["productos premium", "catálogo", "ventas", "envíos", brandConfig.brandName],
  authors: [{ name: brandConfig.brandName }],
  creator: brandConfig.brandName,
  publisher: brandConfig.brandName,
  openGraph: {
    title: `${brandConfig.brandName} | ${brandConfig.tagline}`,
    description: `${brandConfig.tagline}. Premium products.`,
    url: "/",
    siteName: brandConfig.brandName,
    locale: "es_DO",
    type: "website",
    images: [{ url: brandConfig.logoPath, width: 1200, height: 630, alt: `${brandConfig.brandName} - ${brandConfig.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brandConfig.brandName} | ${brandConfig.tagline}`,
    description: `${brandConfig.tagline}. Premium products.`,
    images: [brandConfig.logoPath],
  },
  icons: { icon: "/favicon.ico", apple: brandConfig.logoPath },
};

/**
 * Viewport configuration for theme color and mobile settings.
 */
export const viewport: Viewport = {
  themeColor: "#0B132B",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout component that wraps all pages.
 * Sets Spanish as the default language.
 * @param children - The page content to render.
 * @returns The HTML document structure with global styles.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="geo.region" content="DO" />
        {/* iOS PWA support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={brandConfig.brandName} />
        {/* Windows tile */}
        <meta name="msapplication-TileColor" content="#0B132B" />
        <meta name="msapplication-TileImage" content={brandConfig.logoPath} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
