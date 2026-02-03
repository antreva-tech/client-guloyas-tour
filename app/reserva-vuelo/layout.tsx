import { Header, Footer } from "@/components";

/**
 * Reserva de vuelo layout: same navbar and footer so users can navigate back.
 */
export default function ReservaVueloLayout({
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
