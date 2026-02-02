/**
 * Central brand configuration for the retail template.
 * Reads from environment variables with sensible placeholder defaults.
 * Set NEXT_PUBLIC_* vars when customizing for a client.
 */

/** Brand configuration values (client-customizable via env). */
export interface BrandConfig {
  brandName: string;
  tagline: string;
  siteUrl: string;
  logoPath: string;
  whatsappNumber: string;
  whatsappMessage: string;
  contactEmail: string;
  contactEmailSecondary: string;
  addressStreet: string;
  addressCity: string;
  addressCountry: string;
  instagramHandle: string;
  instagramUrl: string;
  /** Optional year for "Since YYYY" copy (e.g. "2014"). */
  foundedYear: string;
  /** Optional image for link preview (OG/Twitter). Use 1200×630; absolute URL or path. Falls back to logoPath. */
  ogImagePath: string;
}

/**
 * Returns the full WhatsApp URL if number is set.
 * @param number - WhatsApp number (e.g. 18295521078) or empty string.
 * @param message - Pre-filled message text.
 * @returns WhatsApp wa.me URL or empty string.
 */
export function getWhatsAppUrl(number: string, message: string): string {
  if (!number?.trim()) return "";
  const clean = number.replace(/\D/g, "");
  if (!clean) return "";
  const text = message ? encodeURIComponent(message) : "";
  return text ? `https://wa.me/${clean}?text=${text}` : `https://wa.me/${clean}`;
}

/** Brand config singleton (env vars evaluated at module load). */
export const brandConfig: BrandConfig = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Your Brand",
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE ?? "Tours y Experiencias",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  logoPath: process.env.NEXT_PUBLIC_LOGO_PATH ?? "/logo.png",
  ogImagePath: process.env.NEXT_PUBLIC_OG_IMAGE ?? "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  whatsappMessage:
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Hello, I'd like more information.",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com",
  contactEmailSecondary: process.env.NEXT_PUBLIC_CONTACT_EMAIL_2 ?? "",
  addressStreet: process.env.NEXT_PUBLIC_ADDRESS_STREET ?? "",
  addressCity: process.env.NEXT_PUBLIC_ADDRESS_CITY ?? "",
  addressCountry: process.env.NEXT_PUBLIC_ADDRESS_COUNTRY ?? "",
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "",
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
  foundedYear: process.env.NEXT_PUBLIC_FOUNDED_YEAR ?? "",
};

/**
 * Returns absolute URL for the link-preview image (OG/Twitter).
 * Crawlers require absolute URLs; relative paths are resolved with siteUrl.
 * @param imagePath - NEXT_PUBLIC_OG_IMAGE or logo path (relative or absolute).
 * @param siteUrl - Base site URL.
 * @returns Absolute URL for the image.
 */
export function getAbsoluteOgImageUrl(imagePath: string, siteUrl: string): string {
  if (!imagePath?.trim()) return "";
  const path = imagePath.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = siteUrl.replace(/\/$/, "");
  const seg = path.startsWith("/") ? path : `/${path}`;
  return `${base}${seg}`;
}
