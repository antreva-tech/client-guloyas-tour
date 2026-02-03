import type { Metadata } from "next";
import {
  Header,
  Hero,
  About,
  Catalog,
  NewsSection,
  HotelOffersSection,
  Shipping,
  Contact,
  Footer,
  WhatsAppFloat,
  SeoStructuredData,
} from "@/components";
import { getActiveProducts } from "@/lib/products";
import { getLowStockThreshold } from "@/lib/settings";
import { getDictionary } from "@/lib/i18n";

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
 * Server component that fetches tours from database.
 * Renders all marketing sections in order.
 * If the database is unreachable, shows empty catalog so the page still loads.
 * @returns The main landing page layout.
 */
export default async function Home() {
  let tours: Awaited<ReturnType<typeof getActiveProducts>> = [];
  let defaultLowSeatsThreshold = 5;

  const t = getDictionary();
  const faqFromShipping = t.shipping.features.map((f) => ({
    question: f.title,
    answer: f.description,
  }));

  try {
    const [toursResult, thresholdResult] = await Promise.all([
      getActiveProducts(),
      getLowStockThreshold(),
    ]);
    tours = toursResult;
    defaultLowSeatsThreshold = thresholdResult;
  } catch (err) {
    console.error("Home: database unreachable, showing empty catalog:", err);
  }

  return (
    <>
      <SeoStructuredData products={tours} faq={faqFromShipping} />
      <Header />
      <main role="main" id="main-content">
        <Hero />
        <Catalog tours={tours} defaultLowSeatsThreshold={defaultLowSeatsThreshold} />
        <About />
        <NewsSection />
        <HotelOffersSection />
        <Shipping />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
