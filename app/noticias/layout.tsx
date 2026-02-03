import { Header, Footer } from "@/components";

/**
 * Noticias layout: same navbar and footer as main site so users can jump to any section.
 */
export default function NoticiasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="pt-14 sm:pt-16 min-h-screen bg-brand-canvas">
        {children}
      </div>
      <Footer />
    </>
  );
}
