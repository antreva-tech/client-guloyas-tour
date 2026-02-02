"use client";

import { ProductCard, type Product } from "./ProductCard";
import { brandConfig, getWhatsAppUrl as getBrandWhatsAppUrl } from "@/lib/brandConfig";

/**
 * Props for the CatalogClient component.
 */
interface CatalogClientProps {
  tours: Product[];
  /** Default low-seats threshold when tour has none set. */
  defaultLowSeatsThreshold?: number;
}

/**
 * Generates WhatsApp URL with prefilled message for tour inquiry.
 * @param product - The tour to inquire about.
 * @returns The WhatsApp deep link URL.
 */
function getWhatsAppUrl(product: Product): string {
  const message = `¡Hola! Me interesa el tour "${product.name}". ¿Podrían darme más información o reservar?`;
  return getBrandWhatsAppUrl(brandConfig.whatsappNumber, message) || "#";
}

/**
 * Client component for the tours catalog (single grid).
 * @param tours - Array of tours/experiences.
 * @returns The catalog element.
 */
export function CatalogClient({
  tours,
  defaultLowSeatsThreshold,
}: CatalogClientProps) {
  const handleContact = (product: Product) => {
    window.open(getWhatsAppUrl(product), "_blank");
  };

  if (tours.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-muted text-base">
          No hay tours disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {tours.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onContact={handleContact}
          defaultLowSeatsThreshold={defaultLowSeatsThreshold}
        />
      ))}
    </div>
  );
}
