import { getDictionary } from "@/lib/i18n";
import { brandConfig, getWhatsAppUrl } from "@/lib/brandConfig";

/**
 * Shipping information section component.
 * Displays delivery options and policies.
 * Light theme with subtle shadows.
 * @returns The shipping section element.
 */
export function Shipping() {
  const t = getDictionary();
  const shippingFeatures = [
    {
      icon: "🚚",
      title: t.shipping.features[0].title,
      description: t.shipping.features[0].description,
    },
    {
      icon: "🌎",
      title: t.shipping.features[1].title,
      description: t.shipping.features[1].description,
    },
    {
      icon: "📦",
      title: t.shipping.features[2].title,
      description: t.shipping.features[2].description,
    },
    {
      icon: "💬",
      title: t.shipping.features[3].title,
      description: t.shipping.features[3].description,
    },
  ];

  return (
    <section id="envios" className="py-12 sm:py-20 bg-porcelain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-gold-500 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            {t.shipping.sectionLabel}
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-jet mt-2 mb-3 sm:mb-4">
            {t.shipping.headline}
          </h2>
          <p className="text-jet/60 max-w-2xl mx-auto text-sm sm:text-base">
            {t.shipping.subheadline}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {shippingFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-pearl p-4 sm:p-6 rounded-xl border border-gold-200/30 hover:border-gold-500/40 transition-colors text-center"
            >
              <span className="text-3xl sm:text-4xl mb-2 sm:mb-4 block">{feature.icon}</span>
              <h3 className="text-sm sm:text-lg font-semibold text-jet mb-1 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-jet/60 text-xs sm:text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Location info */}
        {(brandConfig.addressStreet || brandConfig.addressCity || brandConfig.whatsappNumber) && (
        <div className="mt-8 sm:mt-12 bg-gradient-to-r from-graphite to-onyx rounded-xl p-5 sm:p-8 border border-smoke">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-porcelain mb-1 sm:mb-2">
                📍 {t.shipping.location}
              </h3>
              <p className="text-porcelain/70 text-sm sm:text-base">
                {[brandConfig.addressStreet, brandConfig.addressCity, brandConfig.addressCountry].filter(Boolean).join(", ") || t.shipping.subheadline}
              </p>
            </div>
            {brandConfig.whatsappNumber && (
            <a
              href={getWhatsAppUrl(brandConfig.whatsappNumber, "Hola, quisiera coordinar un envío")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full md:w-auto text-center px-6 py-3.5 sm:py-3 rounded-full font-semibold whitespace-nowrap touch-manipulation"
            >
              {t.shipping.coordinate}
            </a>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
