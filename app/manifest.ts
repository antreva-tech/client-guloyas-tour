import type { MetadataRoute } from "next";
import { brandConfig } from "@/lib/brandConfig";

/**
 * Generates the web app manifest for PWA and install prompts.
 * Uses brand config for name and theme; improves SEO/AI discoverability.
 * @returns Web App Manifest per W3C spec.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brandConfig.brandName,
    short_name: brandConfig.brandName,
    description: `${brandConfig.tagline}. Tours y experiencias. Reserva por WhatsApp.`,
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8FB",
    theme_color: "#0B132B",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
