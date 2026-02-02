import type { Metadata } from "next";
import { brandConfig } from "@/lib/brandConfig";

export const metadata: Metadata = {
  title: `Admin | ${brandConfig.brandName}`,
  description: `Panel de administración de ${brandConfig.brandName}`,
  robots: "noindex, nofollow",
};

/**
 * Admin layout component.
 * Applies admin-specific metadata (no indexing).
 * @param children - The admin page content.
 * @returns The admin layout wrapper.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
