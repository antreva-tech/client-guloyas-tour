import { getDictionary } from "@/lib/i18n";

const VALUE_ICONS: Record<string, string> = {
  "Calidad Premium": "✨",
  "Premium Quality": "✨",
  "Natural": "🌿",
  "Resultados": "💎",
  "Results": "💎",
  "Confianza": "🏆",
  "Trust": "🏆",
};

/**
 * About/Brand story section component.
 * Mobile-first design highlighting company history and values.
 * @returns The about section element.
 */
export function About() {
  const t = getDictionary();
  const about = t.about;

  return (
    <section id="nosotros" className="py-12 sm:py-20 bg-pearl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Content */}
          <div className="text-center md:text-left">
            <span className="text-aqua-700 text-xs sm:text-sm font-semibold uppercase tracking-wider">
              {about.sectionLabel}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-jet mt-2 mb-4 sm:mb-6">
              {about.headline.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-aqua-700">{about.headline.split(" ").pop()}</span>
            </h2>
            <div className="space-y-3 sm:space-y-4 text-jet/80 text-sm sm:text-base">
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* Values grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {about.values.map((value) => (
              <div
                key={value.title}
                className="bg-porcelain p-4 sm:p-6 rounded-xl border border-gold-200/30 hover:border-gold-500/50 transition-colors"
              >
                <span className="text-xl sm:text-2xl mb-2 sm:mb-3 block">{VALUE_ICONS[value.title] ?? "✨"}</span>
                <h3 className="font-semibold text-jet mb-1 text-sm sm:text-base">{value.title}</h3>
                <p className="text-xs sm:text-sm text-jet/60">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
