"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

/** Character limit before description becomes expandable. */
const DESCRIPTION_EXPAND_THRESHOLD = 150;

/** Minimum swipe distance (px) to change slide. */
const SWIPE_THRESHOLD = 50;

/**
 * Product data interface for catalog items (tours/experiences).
 * Compatible with Prisma Product model (imageUrl/imageUrls).
 */
export interface Product {
  id: string;
  name: string;
  line: string;
  description: string;
  price: number;
  currency: string;
  /** Optional children price; shown next to adult price when set. */
  childPrice?: number | null;
  imageUrl?: string | null;
  /** Multiple tour images; card shows swipeable gallery. Falls back to imageUrl if empty. */
  imageUrls?: string[] | null;
  stock?: number;
  /** Per-tour low-seats threshold; null = use default or hide badge. */
  lowSeatsThreshold?: number | null;
}

/** Sentinel for "always available" seats (never decremented, bookings only tracked). */
const UNLIMITED_STOCK = -1;

/**
 * Determines seats status for display (sold out / low seats / in stock).
 * Low-seats badge only when threshold is defined (per-tour or default).
 * @param stock - Current seats left (-1 = unlimited).
 * @param lowSeatsThreshold - Per-tour threshold (null = owner disabled).
 * @param defaultThreshold - Default threshold when per-tour is null.
 * @returns 'sold_out' | 'low_stock' | 'in_stock'
 */
function getSeatsStatus(
  stock?: number,
  lowSeatsThreshold?: number | null,
  defaultThreshold?: number
): "sold_out" | "low_stock" | "in_stock" {
  if (stock === undefined || stock === null) return "in_stock";
  if (stock === UNLIMITED_STOCK) return "in_stock";
  if (stock <= 0) return "sold_out";
  const effective =
    lowSeatsThreshold !== undefined && lowSeatsThreshold !== null
      ? lowSeatsThreshold
      : defaultThreshold;
  if (effective !== undefined && stock <= effective) return "low_stock";
  return "in_stock";
}

interface ProductCardProps {
  product: Product;
  onContact: (product: Product) => void;
  /** Default low-seats threshold when product.lowSeatsThreshold is null (e.g. from settings). */
  defaultLowSeatsThreshold?: number;
}

/**
 * Tour/experience card for the catalog.
 * Mobile-first design with touch-friendly CTA.
 * Displays seats status (sold out / low seats) using per-tour or default threshold.
 * @param product - The tour data to display.
 * @param onContact - Callback when contact button is clicked.
 * @param defaultLowSeatsThreshold - Default threshold when product.lowSeatsThreshold is null.
 * @returns The product card element.
 */

/** Normalizes product images to an array (imageUrls or single imageUrl fallback). */
function getProductImages(product: Product): string[] {
  if (product.imageUrls?.length) return product.imageUrls;
  if (product.imageUrl) return [product.imageUrl];
  return [];
}

export function ProductCard({
  product,
  onContact,
  defaultLowSeatsThreshold,
}: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const images = getProductImages(product);
  const hasMultipleImages = images.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setImageIndex((prev) => {
        if (index < 0) return images.length - 1;
        if (index >= images.length) return 0;
        return index;
      });
    },
    [images.length]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null || !hasMultipleImages) return;
      const endX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - endX;
      touchStartX.current = null;
      if (Math.abs(diff) >= SWIPE_THRESHOLD) {
        const delta = diff > 0 ? 1 : -1;
        setImageIndex((prev) => {
          const next = prev + delta;
          if (next < 0) return images.length - 1;
          if (next >= images.length) return 0;
          return next;
        });
      }
    },
    [hasMultipleImages, images.length]
  );

  const stockStatus = getSeatsStatus(
    product.stock,
    product.lowSeatsThreshold,
    defaultLowSeatsThreshold
  );
  const isSoldOut = stockStatus === "sold_out";
  const isLowStock = stockStatus === "low_stock";

  const desc = product.description ?? "";
  const isLong = desc.length > DESCRIPTION_EXPAND_THRESHOLD;
  const truncated = isLong ? `${desc.slice(0, DESCRIPTION_EXPAND_THRESHOLD).trim()}…` : desc;

  return (
    <article
      className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 group ${
        isSoldOut
          ? "border-brand-border opacity-75"
          : "border-brand-sand/50 hover:border-brand-sunset/50 hover:shadow-lg"
      }`}
    >
      {/* Product image(s) - swipeable when multiple */}
      <div
        className="aspect-[4/3] sm:aspect-square bg-brand-canvas relative overflow-hidden flex items-center justify-center touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 ? (
          <>
            {images.map((url, i) => (
              <div
                key={url}
                className="absolute inset-0 transition-opacity duration-300"
                style={{ opacity: i === imageIndex ? 1 : 0, pointerEvents: i === imageIndex ? "auto" : "none" }}
              >
                <Image
                  src={url}
                  alt={`${product.name}${images.length > 1 ? ` (${i + 1}/${images.length})` : ""}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-contain p-4 transition-transform duration-500 ${
                    isSoldOut ? "grayscale" : "group-hover:scale-105"
                  }`}
                />
              </div>
            ))}
            {/* Dots and prev/next when multiple images */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); goTo(imageIndex - 1); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-lg leading-none z-10"
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); goTo(imageIndex + 1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-lg leading-none z-10"
                  aria-label="Siguiente imagen"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.preventDefault(); setImageIndex(i); }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === imageIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                      }`}
                      aria-label={`Imagen ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center bg-gradient-to-br from-brand-sand/30 to-brand-canvas w-full h-full">
            <div className="text-center">
              <span className="text-5xl sm:text-6xl">🌴</span>
              <p className="text-brand-muted text-xs sm:text-sm mt-2">{product.line}</p>
            </div>
          </div>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-brand-ink/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm sm:text-base font-bold px-4 py-2 rounded-full shadow-lg">
              Sin disponibilidad
            </span>
          </div>
        )}

        {/* Low seats badge */}
        {isLowStock && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-brand-coral text-white text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full animate-pulse">
            ¡Pocas plazas!
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="text-brand-sky text-[10px] sm:text-xs font-medium uppercase tracking-wider">
            {product.line}
          </span>
          {isLowStock && (
            <span className="text-brand-coral text-[10px] sm:text-xs font-medium">
              • Solo {product.stock} plazas
            </span>
          )}
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-brand-ink mt-1 mb-1.5 sm:mb-2">
          {product.name}
        </h3>
        <div className="mb-3 sm:mb-4">
          <p
            className={`text-brand-muted text-xs sm:text-sm whitespace-pre-wrap transition-colors ${
              isLong ? "cursor-pointer hover:text-brand-ink/80 select-none" : ""
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
              className="text-brand-sky text-xs font-medium mt-1 hover:text-brand-sunset focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:ring-offset-1 rounded"
            >
              {isExpanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>

        {/* Price and CTA: adult price; kid price when set (different color, labeled) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`text-xl sm:text-2xl font-bold ${isSoldOut ? "text-brand-muted" : "text-brand-ink"}`}>
              {product.currency} {product.price.toLocaleString()}
            </span>
            {product.childPrice != null && product.childPrice > 0 && (
              <span className={`text-sm font-medium ${isSoldOut ? "text-brand-muted" : "text-amber-600"}`}>
                Niño {product.currency} {product.childPrice.toLocaleString()}
              </span>
            )}
          </div>
          {isSoldOut ? (
            <button
              disabled
              className="bg-brand-border text-brand-muted px-4 sm:px-5 py-2.5 sm:py-2 rounded-full text-sm font-semibold cursor-not-allowed flex-shrink-0"
            >
              Sin disponibilidad
            </button>
          ) : (
            <button
              onClick={() => onContact(product)}
              className="btn-primary px-4 sm:px-5 py-2.5 sm:py-2 rounded-full text-sm font-semibold touch-manipulation flex-shrink-0"
            >
              Reservar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
