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
    <section
      className="relative min-h-[100dvh] flex items-center justify-center pt-14 sm:pt-16 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #19173b 0%, #272454 60%, #5a58a2 100%)" }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-sunset/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          {/* Logo mark – no background, sits on gradient; subtle glow */}
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-sunset/15 via-brand-gold/15 to-brand-sunset/15 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative">
                <Image
                  src={brandConfig.logoPath}
                  alt={brandConfig.brandName}
                  width={480}
                  height={192}
                  className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
            <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent to-brand-gold/50" />
            <span className="text-brand-sand text-xs tracking-widest uppercase">{brandConfig.brandName}</span>
            <div className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent to-brand-gold/50" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-night-text mb-4 sm:mb-6 leading-tight">
            {t.hero.headline.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-gradient-gold">{t.hero.headline.split(" ").pop()}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl text-night-muted max-w-2xl mx-auto mb-8 sm:mb-10 px-2 leading-relaxed">
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-night-muted text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-brand-gold">✦</span>
              <span>{t.hero.since}</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-brand-gold/50" />
            <div className="flex items-center gap-2">
              <span className="text-brand-sunset">✦</span>
              <span>{brandConfig.tagline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 sm:w-[500px] h-32 sm:h-48 bg-brand-sky/15 rounded-full blur-3xl" />
    </section>
  );
}
