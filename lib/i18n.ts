/**
 * Internationalization (i18n) module for the retail template.
 * Supports Spanish (es) as default with English (en).
 * Brand values come from brandConfig (env-driven).
 */

import { brandConfig } from "./brandConfig";

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";
export const SUPPORTED_LOCALES: Locale[] = ["es", "en"];

/**
 * Dictionary type for translations.
 */
export interface Dictionary {
  common: {
    brandName: string;
    tagline: string;
    buyNow: string;
    contact: string;
    viewCatalog: string;
    learnMore: string;
  };
  nav: {
    products: string;
    about: string;
    shipping: string;
    contact: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    since: string;
  };
  products: {
    sectionTitle: string;
    sectionSubtitle: string;
    premium: string;
    consult: string;
    helpChoose: string;
  };
  about: {
    sectionLabel: string;
    headline: string;
    paragraphs: string[];
    values: {
      title: string;
      description: string;
    }[];
  };
  shipping: {
    sectionLabel: string;
    headline: string;
    subheadline: string;
    location: string;
    coordinate: string;
    features: {
      title: string;
      description: string;
    }[];
  };
  contact: {
    sectionLabel: string;
    headline: string;
    subheadline: string;
    whatsappCta: string;
    whatsappSubtext: string;
    startChat: string;
  };
  footer: {
    description: string;
    links: string;
    contactTitle: string;
    copyright: string;
  };
}

/** Base Spanish copy (brand-agnostic). Brand values injected at runtime. */
const esBase: Omit<Dictionary, "common" | "hero" | "footer"> = {
  nav: {
    products: "Productos",
    about: "Nosotros",
    shipping: "Envíos",
    contact: "Contacto",
  },
  products: {
    sectionTitle: "Nuestras Líneas de Productos",
    sectionSubtitle:
      "Productos de alta calidad para diferentes necesidades. Consulta disponibilidad y precios.",
    premium: "Premium",
    consult: "Consultar",
    helpChoose: "¿Necesitas ayuda para elegir? Contáctanos por WhatsApp",
  },
  about: {
    sectionLabel: "Nuestra Historia",
    headline: "Calidad y confianza",
    paragraphs: [
      "Marca dedicada a ofrecer productos de alta calidad.",
      "Nos enfocamos en diseñar productos que cumplen con los más altos estándares.",
      "Cada uno de nuestros productos está formulado con ingredientes selectos para brindar resultados visibles.",
    ],
    values: [
      { title: "Calidad Premium", description: "Ingredientes selectos y fórmulas especializadas" },
      { title: "Natural", description: "Componentes de calidad" },
      { title: "Resultados", description: "Efectos visibles" },
      { title: "Confianza", description: "Compromiso con la excelencia" },
    ],
  },
  shipping: {
    sectionLabel: "Entregas",
    headline: "Información de Envíos",
    subheadline: "Llevamos nuestros productos a donde los necesites",
    location: "Ubicación",
    coordinate: "Coordinar Envío",
    features: [
      {
        title: "Envíos Nacionales",
        description: "Entregas disponibles a nivel nacional.",
      },
      {
        title: "Envíos Internacionales",
        description:
          "Para envíos internacionales, favor consultar disponibilidad y costos.",
      },
      {
        title: "Empaque Seguro",
        description:
          "Todos los productos son empacados cuidadosamente para garantizar su llegada en perfectas condiciones.",
      },
      {
        title: "Soporte Personalizado",
        description:
          "Coordina tu envío directamente con nuestro equipo vía WhatsApp.",
      },
    ],
  },
  contact: {
    sectionLabel: "Contacto",
    headline: "¿Listo para hacer tu pedido?",
    subheadline:
      "Contáctanos por WhatsApp para hacer tu pedido o resolver cualquier duda.",
    whatsappCta: "Escríbenos por WhatsApp",
    whatsappSubtext: "Respuesta rápida • Atención personalizada • Pedidos directos",
    startChat: "Iniciar Chat",
  },
};

/** Build Spanish dictionary with brand config. */
function buildEs(): Dictionary {
  const since = brandConfig.foundedYear
    ? `Desde ${brandConfig.foundedYear} — ${brandConfig.brandName}`
    : `— ${brandConfig.brandName}`;
  return {
    ...esBase,
    common: {
      brandName: brandConfig.brandName,
      tagline: brandConfig.tagline,
      buyNow: "Comprar Ahora",
      contact: "Contactar",
      viewCatalog: "Ver Catálogo",
      learnMore: "Más Información",
    },
    hero: {
      headline: brandConfig.tagline,
      subheadline:
        "Productos de alta calidad diseñados para satisfacer tus necesidades.",
      since,
    },
    footer: {
      description: "Productos de alta calidad.",
      links: "Enlaces",
      contactTitle: "Contacto",
      copyright: `${brandConfig.brandName}. Todos los derechos reservados.`,
    },
  };
}

/** Base English copy (brand-agnostic). */
const enBase: Omit<Dictionary, "common" | "hero" | "footer"> = {
  nav: { products: "Products", about: "About", shipping: "Shipping", contact: "Contact" },
  products: {
    sectionTitle: "Our Product Lines",
    sectionSubtitle: "High-quality products for your needs. Inquire about availability and pricing.",
    premium: "Premium",
    consult: "Inquire",
    helpChoose: "Need help choosing? Contact us via WhatsApp",
  },
  about: {
    sectionLabel: "Our Story",
    headline: "Quality and trust",
    paragraphs: [
      "A brand dedicated to offering high-quality products.",
      "We focus on designing products that meet the highest standards.",
      "Each of our products is formulated with select ingredients for visible results.",
    ],
    values: [
      { title: "Premium Quality", description: "Select ingredients and specialized formulas" },
      { title: "Natural", description: "Quality components" },
      { title: "Results", description: "Visible effects" },
      { title: "Trust", description: "Commitment to excellence" },
    ],
  },
  shipping: {
    sectionLabel: "Delivery",
    headline: "Shipping Information",
    subheadline: "We deliver our products wherever you need them",
    location: "Location",
    coordinate: "Coordinate Shipping",
    features: [
      { title: "National Shipping", description: "Deliveries available nationwide." },
      { title: "International Shipping", description: "For international shipments, inquire about availability and costs." },
      { title: "Secure Packaging", description: "All products are carefully packaged for safe delivery." },
      { title: "Personalized Support", description: "Coordinate your shipment directly with our team via WhatsApp." },
    ],
  },
  contact: {
    sectionLabel: "Contact",
    headline: "Ready to place your order?",
    subheadline: "Contact us via WhatsApp to place your order or resolve any questions.",
    whatsappCta: "Message us on WhatsApp",
    whatsappSubtext: "Fast response • Personalized attention • Direct orders",
    startChat: "Start Chat",
  },
};

/** Build English dictionary with brand config. */
function buildEn(): Dictionary {
  const since = brandConfig.foundedYear
    ? `Since ${brandConfig.foundedYear} — ${brandConfig.brandName}`
    : `— ${brandConfig.brandName}`;
  return {
    ...enBase,
    common: {
      brandName: brandConfig.brandName,
      tagline: brandConfig.tagline,
      buyNow: "Buy Now",
      contact: "Contact",
      viewCatalog: "View Catalog",
      learnMore: "Learn More",
    },
    hero: {
      headline: brandConfig.tagline,
      subheadline: "High-quality products designed to meet your needs.",
      since,
    },
    footer: {
      description: "High-quality products.",
      links: "Links",
      contactTitle: "Contact",
      copyright: `${brandConfig.brandName}. All rights reserved.`,
    },
  };
}

/**
 * Dictionary map for all supported locales (built with brand config).
 */
const dictionaries: Record<Locale, Dictionary> = {
  es: buildEs(),
  en: buildEn(),
};

/**
 * Retrieves the dictionary for a given locale.
 * Falls back to Spanish if locale is not found.
 * @param locale - The locale code.
 * @returns The dictionary for the locale.
 */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/**
 * Checks if a locale is supported.
 * @param locale - The locale to check.
 * @returns True if the locale is supported.
 */
export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}
