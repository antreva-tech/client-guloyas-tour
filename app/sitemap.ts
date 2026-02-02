import { MetadataRoute } from "next";

/**
 * Generates a sitemap for public marketing pages.
 * Single-page site: one canonical URL (fragment URLs are not indexed by Google).
 * @returns Array of sitemap entries with URL and metadata.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
