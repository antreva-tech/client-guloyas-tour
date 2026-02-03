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
  social: {
    sectionLabel: string;
    headline: string;
    subtext: string;
    followInstagram: string;
    followTikTok: string;
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
    products: "Tours",
    about: "Nosotros",
    shipping: "Cómo reservar",
    contact: "Contacto",
  },
  products: {
    sectionTitle: "Tours y Experiencias",
    sectionSubtitle:
      "Descubre nuestras excursiones y experiencias. Reserva tu plaza por WhatsApp.",
    premium: "Premium",
    consult: "Reservar",
    helpChoose: "¿Dudas? Contáctanos por WhatsApp",
  },
  about: {
    sectionLabel: "Nuestra Historia",
    headline: "Calidad y confianza",
    paragraphs: [
      "Agencia dedicada a ofrecer tours y experiencias de calidad.",
      "Nos enfocamos en diseñar excursiones que cumplen con los más altos estándares.",
      "Cada uno de nuestros tours está pensado para brindar experiencias memorables.",
    ],
    values: [
      { title: "Calidad Premium", description: "Experiencias seleccionadas y bien organizadas" },
      { title: "Natural", description: "Destinos auténticos" },
      { title: "Resultados", description: "Experiencias memorables" },
      { title: "Confianza", description: "Compromiso con la excelencia" },
    ],
  },
  shipping: {
    sectionLabel: "Cómo reservar",
    headline: "Reserva tu experiencia en pocos pasos",
    subheadline: "Elige tu tour, escríbenos por WhatsApp y te confirmamos punto de encuentro y detalles.",
    location: "Ubicación",
    coordinate: "Consultar por WhatsApp",
    features: [
      {
        title: "Elige tu tour",
        description: "Explora el catálogo y elige la excursión o experiencia que quieras.",
      },
      {
        title: "Reserva por WhatsApp",
        description: "Escríbenos para confirmar disponibilidad y plazas.",
      },
      {
        title: "Confirmación y pago",
        description: "Te confirmamos la reserva y coordinamos forma de pago.",
      },
      {
        title: "Punto de encuentro",
        description: "Te indicamos hora y lugar de salida para disfrutar tu tour.",
      },
    ],
  },
  contact: {
    sectionLabel: "Contacto",
    headline: "¿Listo para reservar tu tour?",
    subheadline:
      "Contáctanos por WhatsApp para reservar o resolver cualquier duda.",
    whatsappCta: "Escríbenos por WhatsApp",
    whatsappSubtext: "Respuesta rápida • Atención personalizada • Reservas directas",
    startChat: "Iniciar Chat",
  },
  social: {
    sectionLabel: "Redes sociales",
    headline: "Síguenos en redes",
    subtext: "Fotos, videos y novedades de nuestros tours.",
    followInstagram: "Seguir en Instagram",
    followTikTok: "Seguir en TikTok",
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
      buyNow: "Reservar",
      contact: "Contactar",
      viewCatalog: "Reservar un tour",
      learnMore: "Más Información",
    },
    hero: {
      headline: brandConfig.tagline,
      subheadline:
        "Tours y experiencias diseñados para que vivas momentos inolvidables.",
      since,
    },
    footer: {
      description: "Tours y experiencias de calidad.",
      links: "Enlaces",
      contactTitle: "Contacto",
      copyright: `${brandConfig.brandName}. Todos los derechos reservados.`,
    },
  };
}

/** Base English copy (brand-agnostic). */
const enBase: Omit<Dictionary, "common" | "hero" | "footer"> = {
  nav: { products: "Tours", about: "About", shipping: "How to book", contact: "Contact" },
  products: {
    sectionTitle: "Tours and Experiences",
    sectionSubtitle: "Discover our excursions and experiences. Book your spot via WhatsApp.",
    premium: "Premium",
    consult: "Book",
    helpChoose: "Questions? Contact us via WhatsApp",
  },
  about: {
    sectionLabel: "Our Story",
    headline: "Quality and trust",
    paragraphs: [
      "Agency dedicated to offering quality tours and experiences.",
      "We focus on designing excursions that meet the highest standards.",
      "Each of our tours is designed to deliver memorable experiences.",
    ],
    values: [
      { title: "Premium Quality", description: "Select ingredients and specialized formulas" },
      { title: "Natural", description: "Quality components" },
      { title: "Results", description: "Visible effects" },
      { title: "Trust", description: "Commitment to excellence" },
    ],
  },
  shipping: {
    sectionLabel: "How to book",
    headline: "Book your experience in a few steps",
    subheadline: "Choose your tour, message us on WhatsApp, and we'll confirm meeting point and details.",
    location: "Location",
    coordinate: "Contact via WhatsApp",
    features: [
      { title: "Choose your tour", description: "Browse the catalog and pick the excursion or experience you want." },
      { title: "Book via WhatsApp", description: "Message us to confirm availability and spots." },
      { title: "Confirmation and payment", description: "We confirm your booking and arrange payment." },
      { title: "Meeting point", description: "We give you the time and place to start your tour." },
    ],
  },
  contact: {
    sectionLabel: "Contact",
    headline: "Ready to book your tour?",
    subheadline: "Contact us via WhatsApp to book or resolve any questions.",
    whatsappCta: "Message us on WhatsApp",
    whatsappSubtext: "Fast response • Personalized attention • Direct bookings",
    startChat: "Start Chat",
  },
  social: {
    sectionLabel: "Social media",
    headline: "Follow us on social",
    subtext: "Photos, videos and updates from our tours.",
    followInstagram: "Follow on Instagram",
    followTikTok: "Follow on TikTok",
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
      buyNow: "Book",
      contact: "Contact",
      viewCatalog: "Book a tour",
      learnMore: "Learn More",
    },
    hero: {
      headline: brandConfig.tagline,
      subheadline: "Tours and experiences designed for unforgettable moments.",
      since,
    },
    footer: {
      description: "Quality tours and experiences.",
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
