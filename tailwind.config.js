// tailwind.config.js — Guloyas Tours color system per docs/color-brand.md

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
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      tablet: "768px",
      "tablet-lg": "1024px",
      portrait: { raw: "(orientation: portrait)" },
      landscape: { raw: "(orientation: landscape)" },
      "tablet-portrait": { raw: "(min-width: 768px) and (orientation: portrait)" },
      "tablet-landscape": { raw: "(min-width: 768px) and (orientation: landscape)" },
      "mobile-landscape": { raw: "(max-width: 767px) and (orientation: landscape)" },
    },
    extend: {
      colors: {
        brand: {
          navy: "#19173b",
          sunset: "#f49724",
          gold: "#f8cf1c",
          coral: "#fa484d",
          magenta: "#e31b81",
          sky: "#579afd",
          violet: "#5a58a2",
          sand: "#feeb9b",
          ink: "#0b0a1b",
          canvas: "#f7f8fb",
          border: "#e6e8f0",
          muted: "#2a2950",
        },
        // Night scale for dark surfaces (color-brand §4)
        night: {
          900: "#0b0a19",
          800: "#121032",
          700: "#19173b",
          600: "#272454",
          border: "#34326a",
          text: "#f3f4ff",
          muted: "#c7c9ff",
        },
        // Semantic (color-brand §6)
        success: "#16a34a",
        warning: "#f59e0b",
        danger: "#dc2626",
        info: "#2563eb",
      },
      backgroundImage: {
        "brand-sunset":
          "linear-gradient(90deg, #f8cf1c 0%, #f49724 35%, #fa484d 70%, #e31b81 100%)",
        "brand-nightfall":
          "linear-gradient(180deg, #19173b 0%, #272454 60%, #5a58a2 100%)",
        "brand-skyline": "linear-gradient(90deg, #5a58a2 0%, #579afd 100%)",
      },
      boxShadow: {
        "brand-focus": "0 0 0 3px rgba(87, 154, 253, 0.35)",
        "soft-lift": "0 10px 30px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
