"use client";

import { useState, useEffect } from "react";

export interface FlightRequestRow {
  id: string;
  departureAirport: string;
  arrivalAirport: string;
  travelDate: string;
  isRoundTrip: boolean;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  createdAt: string;
}

/**
 * Admin section: list flight requests (read-only) for follow-up.
 */
export function FlightRequestsManagementSection() {
  const [requests, setRequests] = useState<FlightRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/flight-requests", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar");
        return res.json();
      })
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-DO", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="space-y-4">
      <h2 className="text-lg tablet:text-xl font-semibold text-jet">
        Solicitudes de reserva de vuelo
      </h2>
      <p className="text-jet/60 text-sm">
        Las solicitudes del formulario público aparecen aquí para seguimiento.
      </p>
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-2 text-danger text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-jet/60 text-sm">Cargando…</p>
      ) : requests.length === 0 ? (
        <p className="text-jet/60 text-sm">No hay solicitudes aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gold-200/50 rounded-lg overflow-hidden">
            <thead className="bg-jet/5">
              <tr>
                <th className="text-left p-3 font-medium text-jet">Fecha solicitud</th>
                <th className="text-left p-3 font-medium text-jet">Salida</th>
                <th className="text-left p-3 font-medium text-jet">Llegada</th>
                <th className="text-left p-3 font-medium text-jet">Viaje</th>
                <th className="text-left p-3 font-medium text-jet">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-gold-200/50">
                  <td className="p-3 text-jet/80">{formatDate(r.createdAt)}</td>
                  <td className="p-3">{r.departureAirport}</td>
                  <td className="p-3">{r.arrivalAirport}</td>
                  <td className="p-3">
                    {new Date(r.travelDate).toLocaleDateString("es-DO")}
                    {r.isRoundTrip ? " (ida y vuelta)" : ""}
                  </td>
                  <td className="p-3 text-jet/80">
                    {[r.customerName, r.customerPhone, r.customerEmail]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
