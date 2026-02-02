"use client";

import { ProductCard, type Product } from "./ProductCard";
import { brandConfig, getWhatsAppUrl as getBrandWhatsAppUrl } from "@/lib/brandConfig";

/**
 * Props for the CatalogClient component.
 */
interface CatalogClientProps {
  kits: Product[];
  individuals: Product[];
}

/**
 * Generates WhatsApp URL with prefilled message for product inquiry.
 * @param product - The product to inquire about.
 * @returns The WhatsApp deep link URL.
 */
function getWhatsAppUrl(product: Product): string {
  const message = `¡Hola! Me interesa el producto "${product.name}" de la línea ${product.line}. ¿Podrían darme más información?`;
  return getBrandWhatsAppUrl(brandConfig.whatsappNumber, message) || "#";
}

/**
 * Client component for the product catalog with separate kit and individual sections.
 * @param kits - Kit/line products.
 * @param individuals - Individual products.
 * @returns The catalog element.
 */
export function CatalogClient({ kits, individuals }: CatalogClientProps) {
  const handleContact = (product: Product) => {
    window.open(getWhatsAppUrl(product), "_blank");
  };

  const hasProducts = kits.length > 0 || individuals.length > 0;

  if (!hasProducts) {
    return (
      <div className="text-center py-12">
        <p className="text-jet/60 text-base">
          No hay productos disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Kits / Lines section */}
      {kits.length > 0 && (
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-jet mb-4 sm:mb-6">
            Kits y Líneas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {kits.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onContact={handleContact}
                  showPremium
                />
              ))}
          </div>
        </div>
      )}

      {/* Individual products section */}
      {individuals.length > 0 && (
        <div className="pt-8 sm:pt-12 border-t border-gold-200/40">
          <h3 className="text-lg sm:text-xl font-semibold text-jet mb-4 sm:mb-6">
            Productos Individuales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {individuals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onContact={handleContact}
                  showPremium={false}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
