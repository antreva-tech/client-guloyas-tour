import Image from "next/image";
import { getDictionary } from "@/lib/i18n";
import { brandConfig } from "@/lib/brandConfig";

/**
 * Hero section component with headline and CTA.
 * Mobile-first design with gradient background and brand messaging.
 * Features elegant logo presentation with decorative accents.
 * @returns The hero section element.
 */
export function Hero() {
  const t = getDictionary();
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center bg-lux-dark pt-14 sm:pt-16 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-onyx via-graphite/50 to-onyx" />

      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-aqua-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          {/* Logo mark with elegant presentation */}
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="relative group">
              {/* Glow effect behind logo */}
              <div className="absolute -inset-3 bg-gradient-to-r from-aqua-500/20 via-gold-200/20 to-aqua-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
              {/* Logo container */}
              <div className="relative bg-porcelain rounded-2xl px-8 py-5 shadow-xl border border-gold-200/30">
                <Image
                  src={brandConfig.logoPath}
                  alt={brandConfig.brandName}
                  width={200}
                  height={80}
                  className="h-16 sm:h-20 w-auto"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
            <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent to-gold-500/50" />
            <span className="text-gold-200 text-xs tracking-widest uppercase">{brandConfig.brandName}</span>
            <div className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent to-gold-500/50" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-porcelain mb-4 sm:mb-6 leading-tight">
            {t.hero.headline.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-gradient-gold">{t.hero.headline.split(" ").pop()}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl text-porcelain/70 max-w-2xl mx-auto mb-8 sm:mb-10 px-2 leading-relaxed">
            {t.hero.subheadline}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0 mb-10 sm:mb-14">
            <a
              href="#productos"
              className="btn-primary px-8 sm:px-10 py-4 sm:py-3.5 rounded-full text-base sm:text-lg font-semibold touch-manipulation"
            >
              {t.common.viewCatalog}
            </a>
            <a
              href="#contacto"
              className="btn-secondary px-8 sm:px-10 py-4 sm:py-3.5 rounded-full text-base sm:text-lg font-semibold touch-manipulation"
            >
              {t.common.contact}
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-porcelain/50 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gold-500">✦</span>
              <span>{t.hero.since}</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gold-500/50" />
            <div className="flex items-center gap-2">
              <span className="text-aqua-500">✦</span>
              <span>{brandConfig.tagline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative aqua glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 sm:w-[500px] h-32 sm:h-48 bg-aqua-500/10 rounded-full blur-3xl" />
    </section>
  );
}
