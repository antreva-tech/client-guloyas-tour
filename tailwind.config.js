// tailwind.config.js (or tailwind.config.ts)
// Luxury Salon Hair Care — color system based on: #000000, #FEFEFE, #08D5FA

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      screens: {
        // Mobile first breakpoints
        'sm': '640px',       // Mobile landscape / large phones
        'md': '768px',       // iPad portrait / small tablets
        'lg': '1024px',      // iPad landscape / desktop
        'xl': '1280px',      // Large desktop
        '2xl': '1536px',     // Extra large screens
        // Tablet-specific breakpoints
        'tablet': '768px',         // iPad Mini/standard portrait
        'tablet-lg': '1024px',     // iPad landscape / iPad Pro portrait
        // Orientation variants (using raw media queries)
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
        // Combined tablet + orientation (for precise targeting)
        'tablet-portrait': { 'raw': '(min-width: 768px) and (orientation: portrait)' },
        'tablet-landscape': { 'raw': '(min-width: 768px) and (orientation: landscape)' },
        'mobile-landscape': { 'raw': '(max-width: 767px) and (orientation: landscape)' },
      },
      extend: {
        colors: {
          // Core (provided)
          jet: "#000000",
          porcelain: "#FEFEFE",
          aqua: {
            500: "#08D5FA", // Aqua Shine (primary accent / CTA / focus)
            700: "#007C92", // Aqua Deep (links/text on light)
            50: "#D6F8FF",  // Aqua Fog (tints)
          },
  
          // Luxury neutrals
          onyx: "#0B0F14",       // main dark background (preferred over pure black)
          graphite: "#141A22",   // surfaces/cards on dark
          smoke: "#2A3441",      // borders/dividers on dark
          pearl: "#F6F3EE",      // soft light background sections
  
          // Metallic accents (premium cues)
          gold: {
            200: "#D8C3A5", // Champagne Gold
            500: "#C8A96A", // Soft Gold
          },
  
          // Optional semantic
          success: "#1F8A70",
          danger: "#B42318",
        },
  
        // Optional: box shadows for subtle luxe glow (no neon blobs)
        boxShadow: {
          "aqua-glow": "0 0 0 3px rgba(8, 213, 250, 0.18)",
          "soft-lift": "0 10px 30px rgba(0, 0, 0, 0.35)",
        },
  
        // Optional: gradients
        backgroundImage: {
          "lux-dark": "linear-gradient(180deg, #0B0F14 0%, #141A22 100%)",
        },
      },
    },
    plugins: [],
  };
  