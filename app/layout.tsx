import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { brandConfig, getAbsoluteOgImageUrl } from "@/lib/brandConfig";

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
 * SEO- and AI-friendly: clear title/description, OG/Twitter, E-E-A-T signals.
 */
const siteDescription =
  `${brandConfig.tagline}. Tours y experiencias en República Dominicana. Reserva por WhatsApp. Coordinación nacional.`;

/** Absolute URL for link preview (OG/Twitter). Crawlers require absolute URLs. */
const previewImagePath = brandConfig.ogImagePath || brandConfig.logoPath;
const absolutePreviewImage = getAbsoluteOgImageUrl(previewImagePath, brandConfig.siteUrl);

export const metadata: Metadata = {
  metadataBase,
  applicationName: brandConfig.brandName,
  title: {
    default: `${brandConfig.brandName} | ${brandConfig.tagline}`,
    template: `%s | ${brandConfig.brandName}`,
  },
  description: siteDescription,
  keywords: [
    "tours",
    "excursiones",
    "República Dominicana",
    "experiencias",
    "reserva por WhatsApp",
    "catálogo",
    brandConfig.brandName,
  ],
  authors: [{ name: brandConfig.brandName }],
  creator: brandConfig.brandName,
  publisher: brandConfig.brandName,
  referrer: "origin-when-cross-origin",
  formatDetection: { email: true, telephone: true },
  openGraph: {
    title: `${brandConfig.brandName} | ${brandConfig.tagline}`,
    description: siteDescription,
    url: "/",
    siteName: brandConfig.brandName,
    locale: "es_DO",
    type: "website",
    images: [
      {
        url: absolutePreviewImage || brandConfig.logoPath,
        width: 1200,
        height: 630,
        alt: `${brandConfig.brandName} - ${brandConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brandConfig.brandName} | ${brandConfig.tagline}`,
    description: siteDescription,
    images: [absolutePreviewImage || brandConfig.logoPath],
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
        <meta name="apple-mobile-web-app-title" content="Guloyas Tours" />
        <meta name="geo.region" content="DO" />
        <meta name="geo.placename" content="República Dominicana" />
        {/* AI/LLM: concise summary for crawlers and summarizers */}
        <meta name="summary" content={siteDescription} />
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
