import { CatalogClient } from "./CatalogClient";
import type { Product } from "./ProductCard";

/**
 * Props for the Catalog component.
 */
interface CatalogProps {
  tours: Product[];
  /** Default low-seats threshold when tour has none set (e.g. from admin settings). */
  defaultLowSeatsThreshold?: number;
}

/**
 * Tours and experiences catalog section.
 * Server component that receives tours from database.
 * Delegates client-side interactivity to CatalogClient.
 * @param tours - Array of tours/experiences.
 * @param defaultLowSeatsThreshold - Default threshold for low-seats badge.
 * @returns The catalog section element.
 */
export function Catalog({ tours, defaultLowSeatsThreshold }: CatalogProps) {
  return (
    <section id="productos" aria-labelledby="catalog-heading" className="py-12 sm:py-20 bg-brand-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-brand-sky text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Catálogo
          </span>
          <h2 id="catalog-heading" className="text-2xl sm:text-4xl font-bold text-brand-ink mt-2 mb-3 sm:mb-4">
            Tours y Experiencias
          </h2>
          <p className="text-brand-muted max-w-2xl mx-auto text-sm sm:text-base px-2">
            Descubre nuestras excursiones y experiencias. Reserva tu plaza por WhatsApp.
          </p>
        </div>

        <CatalogClient tours={tours} defaultLowSeatsThreshold={defaultLowSeatsThreshold} />

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-brand-muted text-xs sm:text-sm">
            ¿Dudas? Contáctanos por WhatsApp
          </p>
        </div>
      </div>
    </section>
  );
}
