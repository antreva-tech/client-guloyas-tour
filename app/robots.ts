import { MetadataRoute } from "next";

/**
 * Generates robots.txt configuration for search engine crawlers.
 * Allows all public pages, disallows admin and API routes.
 * @returns The robots.txt configuration object.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
