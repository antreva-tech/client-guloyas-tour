import { getDictionary } from "@/lib/i18n";
import { brandConfig } from "@/lib/brandConfig";

/**
 * Instagram icon (camera + ring) for use in social CTA buttons.
 * @returns SVG element.
 */
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 sm:w-7 h-6 sm:h-7 fill-current" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

/**
 * TikTok icon (musical note + play) for use in social CTA buttons.
 * @returns SVG element.
 */
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 sm:w-7 h-6 sm:h-7 fill-current" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

/**
 * Social media section with Instagram and TikTok CTAs.
 * Styled like the WhatsApp contact block: dark gradient container, icon + label buttons.
 * Renders only if at least one of Instagram or TikTok URL is configured.
 * @returns The social media section element or null.
 */
export function SocialMediaSection() {
  const t = getDictionary();
  const hasInstagram = Boolean(brandConfig.instagramUrl?.trim());
  const hasTikTok = Boolean(brandConfig.tiktokUrl?.trim());

  if (!hasInstagram && !hasTikTok) return null;

  return (
    <section
      id="redes"
      aria-labelledby="redes-heading"
      className="py-12 sm:py-20 bg-brand-canvas"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12 border border-night-border"
          style={{
            background: "linear-gradient(180deg, #19173b 0%, #272454 60%, #5a58a2 100%)",
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-8">
            <div className="text-center md:text-left">
              <span className="text-brand-sky text-xs sm:text-sm font-semibold uppercase tracking-wider">
                {t.social.sectionLabel}
              </span>
              <h2 id="redes-heading" className="text-xl sm:text-2xl font-bold text-night-text mt-1 mb-1 sm:mb-2">
                {t.social.headline}
              </h2>
              <p className="text-night-muted text-sm sm:text-base">
                {t.social.subtext}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {hasInstagram && (
                <a
                  href={brandConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 text-white w-full sm:w-auto px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg transition-all hover:scale-105 touch-manipulation bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-95"
                  aria-label={t.social.followInstagram}
                >
                  <InstagramIcon />
                  {t.social.followInstagram}
                </a>
              )}
              {hasTikTok && (
                <a
                  href={brandConfig.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#0f0f0f] hover:bg-black text-white w-full sm:w-auto px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg transition-all hover:scale-105 touch-manipulation border border-white/10"
                  aria-label={t.social.followTikTok}
                >
                  <TikTokIcon />
                  {t.social.followTikTok}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
