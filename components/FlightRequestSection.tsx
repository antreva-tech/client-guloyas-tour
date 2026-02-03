"use client";

import { todayDdMmYyyy } from "@/lib/formatDate";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * Flight reservation request form: departure/arrival airport, date, round-trip.
 * Submits to API and shows success/error message.
 */
export function FlightRequestSection() {
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  /** YYYY-MM-DD for API; DatePicker displays as DD/MM/YYYY */
  const [travelDate, setTravelDate] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!travelDate) {
      setMessage({ type: "error", text: "Selecciona la fecha de ida." });
      return;
    }
    if (isRoundTrip && !returnDate) {
      setMessage({ type: "error", text: "Selecciona la fecha de vuelta." });
      return;
    }
    if (isRoundTrip && returnDate && returnDate < travelDate) {
      setMessage({ type: "error", text: "La fecha de vuelta debe ser igual o posterior a la de ida." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/flight-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureAirport: departureAirport.trim(),
          arrivalAirport: arrivalAirport.trim(),
          travelDate,
          isRoundTrip,
          returnDate: isRoundTrip && returnDate ? returnDate : undefined,
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
      setReturnDate("");
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
              Fecha de ida
            </label>
            <DatePicker
              id="flight-date"
              selected={travelDate ? new Date(travelDate + "T12:00:00") : null}
              onChange={(date: Date | null) => {
                if (!date) {
                  setTravelDate("");
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setTravelDate(`${y}-${m}-${d}`);
              }}
              dateFormat="dd/MM/yyyy"
              placeholderText={todayDdMmYyyy()}
              minDate={new Date()}
              isClearable
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="flight-roundtrip"
              type="checkbox"
              checked={isRoundTrip}
              onChange={(e) => {
                setIsRoundTrip(e.target.checked);
                if (!e.target.checked) setReturnDate("");
              }}
              className="rounded border-brand-border"
            />
            <label htmlFor="flight-roundtrip" className="text-sm text-brand-ink">
              Ida y vuelta
            </label>
          </div>
          {isRoundTrip && (
            <div>
              <label htmlFor="flight-return-date" className="block text-sm font-medium text-brand-ink mb-1">
                Fecha de vuelta
              </label>
              <DatePicker
                id="flight-return-date"
                selected={returnDate ? new Date(returnDate + "T12:00:00") : null}
                onChange={(date: Date | null) => {
                  if (!date) {
                    setReturnDate("");
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setReturnDate(`${y}-${m}-${d}`);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText={todayDdMmYyyy()}
                minDate={
                  travelDate
                    ? new Date(travelDate + "T12:00:00")
                    : new Date()
                }
                isClearable
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-jet text-sm"
              />
            </div>
          )}
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
