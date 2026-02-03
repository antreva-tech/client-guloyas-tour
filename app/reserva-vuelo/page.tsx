import type { Metadata } from "next";
import { FlightRequestSection } from "@/components";
import { brandConfig } from "@/lib/brandConfig";

export const metadata: Metadata = {
  title: `Reserva de vuelo | ${brandConfig.brandName}`,
  description: "Solicita tu reserva de vuelo. Indica aeropuerto de salida, llegada, fecha y si es ida y vuelta.",
};

/**
 * Dedicated page for the flight reservation form.
 */
export default function ReservaVueloPage() {
  return (
    <main role="main" id="main-content">
      <FlightRequestSection />
    </main>
  );
}
