/**
 * SEO Structured Data component for JSON-LD schema markup.
 * Emits Organization, WebSite, LocalBusiness, ItemList/Product, and BreadcrumbList schemas
 * for AI/LLM search optimization. Must match visible content per Google guidelines.
 */

import { brandConfig } from "@/lib/brandConfig";

/** Product shape for schema.org Product markup (catalog items). */
interface ProductForSchema {
  id: string;
  name: string;
  line: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  stock?: number;
}

/** Single FAQ entry for FAQPage schema (must match visible content). */
export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Props for the SeoStructuredData component.
 */
interface SeoStructuredDataProps {
  baseUrl?: string;
  /** Catalog tours/experiences for ItemList + Product schema. */
  products?: ProductForSchema[];
  /** FAQ pairs for FAQPage schema (e.g. how to reserve); must match visible content. */
  faq?: FaqItem[];
}

/**
 * Returns absolute image URL for schema.org (handles relative paths).
 * @param imageUrl - Relative path or full URL.
 * @param siteUrl - Base site URL.
 */
function toAbsoluteImageUrl(imageUrl: string, siteUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${siteUrl}${path}`;
}

/**
 * Renders JSON-LD structured data for Organization, WebSite, LocalBusiness, Product, and BreadcrumbList.
 * Helps search engines and AI systems understand the business and catalog.
 * @param baseUrl - The base URL for the website (defaults to env or placeholder).
 * @param products - Catalog products for Product schema (optional).
 * @param faq - FAQ pairs for FAQPage schema (optional).
 * @returns Script elements containing JSON-LD structured data.
 */
export function SeoStructuredData({ baseUrl, products = [], faq = [] }: SeoStructuredDataProps) {
  const siteUrl = baseUrl || brandConfig.siteUrl;
  const logoUrl = brandConfig.logoPath.startsWith("http") ? brandConfig.logoPath : `${siteUrl}${brandConfig.logoPath.startsWith("/") ? "" : "/"}${brandConfig.logoPath}`;

  const sameAs = brandConfig.instagramUrl ? [brandConfig.instagramUrl] : [];
  const contactPoint = brandConfig.whatsappNumber
    ? [{
        "@type": "ContactPoint" as const,
        telephone: `+${brandConfig.whatsappNumber.replace(/\D/g, "").replace(/^1/, "1-")}`,
        contactType: "sales",
        availableLanguage: ["Spanish"],
      }]
    : [];

  const addressSchema = (brandConfig.addressStreet || brandConfig.addressCity)
    ? {
        "@type": "PostalAddress" as const,
        streetAddress: brandConfig.addressStreet || undefined,
        addressLocality: brandConfig.addressCity || undefined,
        addressCountry: brandConfig.addressCountry || undefined,
      }
    : undefined;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandConfig.brandName,
    url: siteUrl,
    logo: logoUrl,
    description: `${brandConfig.tagline}. Tours y experiencias.`,
    ...(brandConfig.foundedYear && { foundingDate: brandConfig.foundedYear }),
    ...(addressSchema && { address: addressSchema }),
    ...(contactPoint.length > 0 && { contactPoint }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  /** WebSite with potentialAction for contact (AI/LLM and search). */
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandConfig.brandName,
    url: siteUrl,
    description: `${brandConfig.tagline}. Tours y experiencias.`,
    inLanguage: "es-DO",
    publisher: { "@type": "Organization" as const, name: brandConfig.brandName },
    ...(brandConfig.whatsappNumber && {
      potentialAction: {
        "@type": "ContactPage" as const,
        url: `${siteUrl}/#contacto`,
        name: "Contactar por WhatsApp",
      },
    }),
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#localbusiness`,
    name: brandConfig.brandName,
    image: logoUrl,
    url: siteUrl,
    ...(brandConfig.whatsappNumber && { telephone: `+${brandConfig.whatsappNumber.replace(/\D/g, "")}` }),
    priceRange: "$$",
    description: brandConfig.tagline,
    openingHours: "Mo-Fr 08:00-17:00",
    ...(addressSchema && { address: addressSchema }),
  };

  /**
   * BreadcrumbList schema for navigation (matches nav and section id productos).
   */
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Productos", item: `${siteUrl}/#productos` },
    ],
  };

  /**
   * Product + TouristTrip schema for tour/experience items (AI entity depth).
   */
  const productSchemas = products.map((p) => {
    const imageUrl = p.imageUrl ? toAbsoluteImageUrl(p.imageUrl, siteUrl) : logoUrl;
    const availability =
      p.stock === undefined || p.stock === null || p.stock === -1 || p.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${siteUrl}/#tour-${p.id}`,
      additionalType: "https://schema.org/TouristTrip",
      sku: p.id,
      name: p.name,
      description: p.description,
      image: imageUrl,
      brand: { "@type": "Brand", name: brandConfig.brandName },
      offers: {
        "@type": "Offer",
        price: p.price,
        priceCurrency: "DOP",
        availability,
        url: `${siteUrl}/#productos`,
      },
    };
  });

  /**
   * FAQPage schema from "Cómo reservar" content (must match visible copy).
   */
  const faqSchema =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  const itemListSchema =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@id": `${siteUrl}/#tour-${p.id}`,
              name: p.name,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {productSchemas.map((schema, i) => (
        <script
          key={schema["@id"] ?? i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
