"use client";

import { useState, useEffect } from "react";

export interface HotelOfferItem {
  id: string;
  title: string;
  description: string;
  linkUrl: string;
  imageUrl: string | null;
  price: number | null;
  validFrom: string | null;
  validUntil: string | null;
  sequence: number;
  isActive: boolean;
}

/**
 * Fetches and displays active hotel offers in a card grid.
 */
export function HotelOffersSection() {
  const [offers, setOffers] = useState<HotelOfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hotel-offers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOffers(Array.isArray(data) ? data : []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || offers.length === 0) return null;

  return (
    <section id="ofertas-hoteles" aria-labelledby="hotel-offers-heading" className="py-12 sm:py-20 bg-brand-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-brand-sky text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Ofertas
          </span>
          <h2 id="hotel-offers-heading" className="text-2xl sm:text-4xl font-bold text-brand-ink mt-2">
            Ofertas de hoteles
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <a
              key={offer.id}
              href={offer.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-brand-border overflow-hidden hover:border-brand-sunset/50 transition-colors block"
            >
              {offer.imageUrl ? (
                <div className="relative aspect-[16/10] bg-brand-muted/10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offer.imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-brand-muted/10 flex items-center justify-center text-brand-muted/50 text-4xl">
                  🏨
                </div>
              )}
              <div className="p-5">
                <h3 className="font-semibold text-brand-ink text-lg mb-2 group-hover:text-brand-sunset">
                  {offer.title}
                </h3>
                {offer.price != null && (
                  <p className="text-brand-sunset font-semibold text-sm mb-2">
                    RD$ {offer.price.toLocaleString()}
                  </p>
                )}
                <p className="text-brand-muted text-sm line-clamp-2 mb-3">
                  {offer.description}
                </p>
                <span className="text-brand-sunset font-medium text-sm group-hover:underline">
                  Ver oferta →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
