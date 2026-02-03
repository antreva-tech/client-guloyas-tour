import Image from "next/image";
import { getDictionary } from "@/lib/i18n";
import { brandConfig } from "@/lib/brandConfig";
import { formatPhoneForDisplay } from "@/lib/phone";

/**
 * Footer component with brand info and links.
 * Mobile-first responsive design.
 * @returns The footer element.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = getDictionary();

  const contactLines = [
    brandConfig.whatsappNumber && `WhatsApp: ${formatPhoneForDisplay(brandConfig.whatsappNumber)}`,
    brandConfig.contactEmail,
    brandConfig.contactEmailSecondary,
    brandConfig.addressStreet,
    brandConfig.addressCity && brandConfig.addressCountry
      ? `${brandConfig.addressCity}, ${brandConfig.addressCountry}`
      : brandConfig.addressCity || brandConfig.addressCountry,
  ].filter(Boolean);

  return (
    <footer className="bg-brand-navy border-t border-night-border pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Brand - full width on mobile */}
          <div className="col-span-2 md:col-span-1 text-center md:text-left mb-4 md:mb-0">
            <div className="inline-block mb-3 sm:mb-4">
              <Image
                src={brandConfig.logoPath}
                alt={brandConfig.brandName}
                width={480}
                height={192}
                className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto object-contain"
              />
            </div>
            <p className="text-night-muted text-xs sm:text-sm">
              {t.footer.description}
            </p>
          </div>

          {/* Quick links: matches header nav; /#section so anchors work from any page */}
          <div>
            <h4 className="text-night-text font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Enlaces</h4>
            <ul className="space-y-2">
              {[
                { href: "/#productos", label: "Productos" },
                { href: "/#nosotros", label: "Nosotros" },
                { href: "/noticias", label: "Noticias" },
                { href: "/reserva-vuelo", label: "Reserva de vuelo" },
                { href: "/#reservar", label: "Cómo reservar" },
                { href: "/#contacto", label: "Contacto" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-night-muted hover:text-brand-sky text-xs sm:text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info: WhatsApp, email(s), address. */}
          <div>
            <h4 className="text-night-text font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t.footer.contactTitle}</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-night-muted">
              {contactLines.map((line) => {
                const isEmail = typeof line === "string" && line.includes("@");
                return (
                  <li key={String(line)}>
                    {isEmail ? (
                      <a href={`mailto:${line}`} className="hover:text-brand-sky transition-colors break-all">
                        {line}
                      </a>
                    ) : (
                      line
                    )}
                  </li>
                );
              })}
            </ul>
            {(brandConfig.instagramUrl || brandConfig.tiktokUrl) && (
            <div className="flex gap-4 mt-3 sm:mt-4">
              {brandConfig.instagramUrl && (
                <a
                  href={brandConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-night-muted hover:text-brand-sky transition-colors touch-manipulation p-1"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              {brandConfig.tiktokUrl && (
                <a
                  href={brandConfig.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-night-muted hover:text-brand-sky transition-colors touch-manipulation p-1"
                  aria-label="TikTok"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-night-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-night-muted/80 text-xs sm:text-sm">
            © {currentYear} {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
