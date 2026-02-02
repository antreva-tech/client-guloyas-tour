import { CatalogClient } from "./CatalogClient";
import type { Product } from "./ProductCard";

/**
 * Props for the Catalog component.
 */
interface CatalogProps {
  kits: Product[];
  individuals: Product[];
}

/**
 * Product catalog section component.
 * Server component that receives products from database.
 * Delegates client-side interactivity to CatalogClient.
 * @param kits - Array of kit/line products.
 * @param individuals - Array of individual products.
 * @returns The catalog section element.
 */
export function Catalog({ kits, individuals }: CatalogProps) {
  return (
    <section id="productos" className="py-12 sm:py-20 bg-pearl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-aqua-700 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Catálogo
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-jet mt-2 mb-3 sm:mb-4">
            Nuestras Líneas de Productos
          </h2>
          <p className="text-jet/60 max-w-2xl mx-auto text-sm sm:text-base px-2">
            Cada línea está formulada con ingredientes premium para diferentes
            necesidades capilares. Kits completos y productos individuales.
          </p>
        </div>

        {/* Products grid - client component for interactivity */}
        <CatalogClient kits={kits} individuals={individuals} />

        {/* Additional info */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-jet/50 text-xs sm:text-sm">
            ¿Necesitas ayuda para elegir? Contáctanos por WhatsApp
          </p>
        </div>
      </div>
    </section>
  );
}
