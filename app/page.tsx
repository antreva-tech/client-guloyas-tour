import type { Metadata } from "next";
import {
  Header,
  Hero,
  About,
  Catalog,
  Shipping,
  Contact,
  Footer,
  WhatsAppFloat,
  SeoStructuredData,
} from "@/components";
import { getActiveKits, getActiveIndividuals } from "@/lib/products";

/**
 * Force dynamic rendering to ensure fresh product data on each request.
 * Without this, Vercel caches the page and new products won't appear.
 */
export const dynamic = "force-dynamic";

/**
 * Page-specific metadata for the home page.
 * Extends the root metadata with canonical URL.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Home page component for the retail template.
 * Server component that fetches kit products from database.
 * Only kits are shown on the main catalog.
 * Renders all marketing sections in order.
 * Mobile-first responsive design.
 * @returns The main landing page layout.
 */
export default async function Home() {
  const [kits, individuals] = await Promise.all([
    getActiveKits(),
    getActiveIndividuals(),
  ]);
  const allProducts = [...kits, ...individuals];

  return (
    <>
      <SeoStructuredData products={allProducts} />
      <Header />
      <main>
        <Hero />
        <Catalog kits={kits} individuals={individuals} />
        <About />
        <Shipping />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
