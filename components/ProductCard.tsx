"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Low stock threshold for displaying urgency badge.
 */
const LOW_STOCK_THRESHOLD = 5;

/** Character limit before description becomes expandable. */
const DESCRIPTION_EXPAND_THRESHOLD = 150;

/**
 * Product data interface for catalog items.
 * Compatible with Prisma Product model (imageUrl can be null).
 */
export interface Product {
  id: string;
  name: string;
  line: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  stock?: number;
}

/**
 * Sentinel for "always available" stock (never decremented, sales only tracked).
 */
const UNLIMITED_STOCK = -1;

/**
 * Determines the stock status of a product.
 * @param stock - The current stock quantity (-1 = always available).
 * @returns 'sold_out' | 'low_stock' | 'in_stock'
 */
function getStockStatus(stock?: number): "sold_out" | "low_stock" | "in_stock" {
  if (stock === undefined || stock === null) return "in_stock";
  if (stock === UNLIMITED_STOCK) return "in_stock";
  if (stock <= 0) return "sold_out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

interface ProductCardProps {
  product: Product;
  onContact: (product: Product) => void;
  /** Show Premium badge (kits/lines only, not individual products) */
  showPremium?: boolean;
}

/**
 * Individual product card component for the catalog.
 * Mobile-first design with touch-friendly CTA.
 * Light theme with subtle shadows for modern feel.
 * Displays stock status badges (sold out / low stock).
 * @param product - The product data to display.
 * @param onContact - Callback when contact button is clicked.
 * @returns The product card element.
 */
export function ProductCard({ product, onContact, showPremium = true }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stockStatus = getStockStatus(product.stock);
  const isSoldOut = stockStatus === "sold_out";
  const isLowStock = stockStatus === "low_stock";

  const desc = product.description ?? "";
  const isLong = desc.length > DESCRIPTION_EXPAND_THRESHOLD;
  const truncated = isLong ? `${desc.slice(0, DESCRIPTION_EXPAND_THRESHOLD).trim()}…` : desc;

  return (
    <article
      className={`bg-porcelain rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 group ${
        isSoldOut
          ? "border-jet/20 opacity-75"
          : "border-gold-200/30 hover:border-gold-500/50 hover:shadow-lg"
      }`}
    >
      {/* Product image */}
      <div className="aspect-[4/3] sm:aspect-square bg-pearl relative overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-contain p-4 transition-transform duration-500 ${
              isSoldOut ? "grayscale" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="flex items-center justify-center bg-gradient-to-br from-aqua-50/30 to-pearl w-full h-full">
            <div className="text-center">
              <span className="text-5xl sm:text-6xl">💆‍♀️</span>
              <p className="text-jet/40 text-xs sm:text-sm mt-2">{product.line}</p>
            </div>
          </div>
        )}

        {/* Sold Out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-jet/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm sm:text-base font-bold px-4 py-2 rounded-full shadow-lg">
              Agotado
            </span>
          </div>
        )}

        {/* Low Stock badge */}
        {isLowStock && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-orange-500 text-white text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full animate-pulse">
            ¡Últimas unidades!
          </div>
        )}

        {/* Premium badge - kits/lines only */}
        {showPremium && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-gold-500 text-jet text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full">
            Premium
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="text-aqua-700 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
            {product.line}
          </span>
          {isLowStock && (
            <span className="text-orange-600 text-[10px] sm:text-xs font-medium">
              • Solo {product.stock} disponibles
            </span>
          )}
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-jet mt-1 mb-1.5 sm:mb-2">
          {product.name}
        </h3>
        <div className="mb-3 sm:mb-4">
          <p
            className={`text-jet/60 text-xs sm:text-sm whitespace-pre-wrap transition-colors ${
              isLong ? "cursor-pointer hover:text-jet/80 select-none" : ""
            }`}
            onClick={() => isLong && setIsExpanded((e) => !e)}
            role={isLong ? "button" : undefined}
            tabIndex={isLong ? 0 : undefined}
            onKeyDown={
              isLong
                ? (ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      setIsExpanded((e) => !e);
                    }
                  }
                : undefined
            }
          >
            {isLong && !isExpanded ? truncated : desc}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((x) => !x);
              }}
              className="text-aqua-700 text-xs font-medium mt-1 hover:text-aqua-500 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:ring-offset-1 rounded"
            >
              {isExpanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className={`text-xl sm:text-2xl font-bold ${isSoldOut ? "text-jet/50" : "text-jet"}`}>
              {product.currency} {product.price.toLocaleString()}
            </span>
          </div>
          {isSoldOut ? (
            <button
              disabled
              className="bg-jet/20 text-jet/50 px-4 sm:px-5 py-2.5 sm:py-2 rounded-full text-sm font-semibold cursor-not-allowed flex-shrink-0"
            >
              No disponible
            </button>
          ) : (
            <button
              onClick={() => onContact(product)}
              className="btn-primary px-4 sm:px-5 py-2.5 sm:py-2 rounded-full text-sm font-semibold touch-manipulation flex-shrink-0"
            >
              Consultar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
