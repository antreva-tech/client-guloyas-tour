"use client";

import { useState } from "react";

/**
 * Flight reservation request form: departure/arrival airport, date, round-trip.
 * Submits to API and shows success/error message.
 */
export function FlightRequestSection() {
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/flight-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureAirport: departureAirport.trim(),
          arrivalAirport: arrivalAirport.trim(),
          travelDate: travelDate || null,
          isRoundTrip,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al enviar. Intenta de nuevo." });
        return;
      }
      setMessage({ type: "success", text: "Solicitud enviada. Te contactaremos pronto." });
      setDepartureAirport("");
      setArrivalAirport("");
      setTravelDate("");
      setIsRoundTrip(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
    } catch {
      setMessage({ type: "error", text: "Error de conexión. Intenta de nuevo." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reserva-vuelo" aria-labelledby="flight-heading" className="py-12 sm:py-20 bg-brand-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-brand-sky text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Reserva
          </span>
          <h2 id="flight-heading" className="text-2xl sm:text-4xl font-bold text-brand-ink mt-2">
            Reserva de vuelo
          </h2>
          <p className="text-brand-muted text-sm mt-2 max-w-xl mx-auto">
            Indica tu ruta y fecha; nos pondremos en contacto contigo.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto bg-white rounded-xl border border-brand-border p-6 space-y-4"
        >
          <div>
            <label htmlFor="flight-departure" className="block text-sm font-medium text-brand-ink mb-1">
              Aeropuerto de salida
            </label>
            <input
              id="flight-departure"
              type="text"
              value={departureAirport}
              onChange={(e) => setDepartureAirport(e.target.value)}
              required
              placeholder="Ej. Las Américas (SDQ)"
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label htmlFor="flight-arrival" className="block text-sm font-medium text-brand-ink mb-1">
              Aeropuerto de llegada
            </label>
            <input
              id="flight-arrival"
              type="text"
              value={arrivalAirport}
              onChange={(e) => setArrivalAirport(e.target.value)}
              required
              placeholder="Ej. JFK (Nueva York)"
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label htmlFor="flight-date" className="block text-sm font-medium text-brand-ink mb-1">
              Fecha
            </label>
            <input
              id="flight-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 10)}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="flight-roundtrip"
              type="checkbox"
              checked={isRoundTrip}
              onChange={(e) => setIsRoundTrip(e.target.checked)}
              className="rounded border-brand-border"
            />
            <label htmlFor="flight-roundtrip" className="text-sm text-brand-ink">
              Ida y vuelta
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="flight-name" className="block text-sm font-medium text-brand-ink mb-1">
                Nombre (opcional)
              </label>
              <input
                id="flight-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
              />
            </div>
            <div>
              <label htmlFor="flight-phone" className="block text-sm font-medium text-brand-ink mb-1">
                Teléfono (opcional)
              </label>
              <input
                id="flight-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="flight-email" className="block text-sm font-medium text-brand-ink mb-1">
              Correo (opcional)
            </label>
            <input
              id="flight-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label htmlFor="flight-notes" className="block text-sm font-medium text-brand-ink mb-1">
              Comentarios (opcional)
            </label>
            <textarea
              id="flight-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          {message && (
            <p
              className={
                message.type === "success"
                  ? "text-success text-sm"
                  : "text-danger text-sm"
              }
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-sunset hover:bg-brand-sunset/90 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
          >
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      </div>
    </section>
  );
}
