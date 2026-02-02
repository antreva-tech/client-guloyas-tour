import { getDictionary } from "@/lib/i18n";
import { brandConfig, getWhatsAppUrl } from "@/lib/brandConfig";
import { formatPhoneForDisplay } from "@/lib/phone";

/**
 * Contact section component with WhatsApp CTA.
 * Primary conversion point for product inquiries.
 * @returns The contact section element.
 */
export function Contact() {
  const t = getDictionary();
  const whatsappUrl = getWhatsAppUrl(brandConfig.whatsappNumber, brandConfig.whatsappMessage);

  const contacts: { type: string; value: string; href: string; primary?: boolean }[] = [];
  if (brandConfig.whatsappNumber) {
    const display = formatPhoneForDisplay(brandConfig.whatsappNumber);
    contacts.push({
      type: "WhatsApp Business",
      value: display,
      href: whatsappUrl,
      primary: true,
    });
  }
  if (brandConfig.contactEmail) {
    contacts.push({
      type: "Email",
      value: brandConfig.contactEmail,
      href: `mailto:${brandConfig.contactEmail}`,
    });
  }
  if (brandConfig.contactEmailSecondary) {
    contacts.push({
      type: "Email",
      value: brandConfig.contactEmailSecondary,
      href: `mailto:${brandConfig.contactEmailSecondary}`,
    });
  }
  if (brandConfig.instagramHandle && brandConfig.instagramUrl) {
    contacts.push({
      type: "Instagram",
      value: brandConfig.instagramHandle,
      href: brandConfig.instagramUrl,
    });
  }
  if (contacts.length === 0) {
    contacts.push({
      type: "Contact",
      value: brandConfig.contactEmail || "Contact us",
      href: `mailto:${brandConfig.contactEmail}`,
      primary: true,
    });
  }

  return (
    <section id="contacto" className="py-12 sm:py-20 bg-brand-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-brand-sky text-xs sm:text-sm font-semibold uppercase tracking-wider">
            {t.contact.sectionLabel}
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-brand-ink mt-2 mb-3 sm:mb-4">
            {t.contact.headline}
          </h2>
          <p className="text-brand-muted max-w-2xl mx-auto text-sm sm:text-base px-2">
            {t.contact.subheadline}
          </p>
        </div>

        {/* Main WhatsApp CTA */}
        {brandConfig.whatsappNumber && (
        <div
          className="rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12 border border-night-border mb-8 sm:mb-12"
          style={{ background: "linear-gradient(180deg, #19173b 0%, #272454 60%, #5a58a2 100%)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-night-text mb-1 sm:mb-2">
                {t.contact.whatsappCta}
              </h3>
              <p className="text-night-muted text-sm sm:text-base">
                {t.contact.whatsappSubtext}
              </p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white w-full md:w-auto px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg transition-all hover:scale-105 touch-manipulation"
            >
              <svg viewBox="0 0 24 24" className="w-6 sm:w-7 h-6 sm:h-7 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t.contact.startChat}
            </a>
          </div>
        </div>
        )}

        {/* Contact options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {contacts.map((contact) => (
            <a
              key={contact.type + contact.value}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border transition-all touch-manipulation ${
                contact.primary
                  ? "bg-brand-sky/10 border-brand-sky/30 hover:border-brand-sky/50"
                  : "bg-white border-brand-border hover:border-brand-sunset/50"
              }`}
            >
              <div
                className={`flex-shrink-0 ${
                  contact.primary ? "text-brand-sky" : "text-brand-muted"
                }`}
              >
                {contact.type === "WhatsApp Business" ? (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                ) : contact.type === "Instagram" ? (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-brand-muted uppercase tracking-wider">
                  {contact.type}
                </p>
                <p className="text-brand-ink font-medium text-xs sm:text-sm truncate">
                  {contact.value}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
