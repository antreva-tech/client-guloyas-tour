"use client";

import { useState, useEffect } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface Seller {
  id: string;
  name: string;
}

interface NameFromSales {
  name: string;
  count: number;
}

/**
 * If candidate is a variant of name (e.g. name="Marlenys", candidate="Marlenys Nolasco"),
 * returns the canonical target to merge into (prefer the fuller name).
 */
function getSuggestedMergeTarget(name: string, candidate: string): string | null {
  const n = name.trim().toLowerCase();
  const c = candidate.trim().toLowerCase();
  if (n === c) return null;
  if (c.startsWith(n + " ")) return candidate;
  if (n.startsWith(c + " ")) return name;
  return null;
}

/**
 * Seller (vendedor) management for Ajustes.
 * Add and remove sellers for the sale form dropdown.
 */
export function SellerManagementSection() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadSellers() {
    setLoading(true);
    try {
      const res = await fetch("/api/sellers");
      if (!res.ok) throw new Error("Error al cargar vendedores");
      const data = await res.json();
      setSellers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSellers();
  }, []);

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 p-6">
      <h2 className="text-lg font-semibold text-jet mb-4">Vendedores</h2>
      <p className="text-jet/60 text-sm mb-6">
        Lista de vendedores para el formulario de ventas. Agrega o elimina según sea necesario.
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-sm mb-4">
          {success}
        </div>
      )}

      {!adding ? (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setError(null);
            setSuccess(null);
          }}
          className="bg-aqua-700 hover:bg-aqua-700/90 text-white px-4 py-2 rounded-lg text-sm font-medium mb-6"
        >
          + Agregar vendedor
        </button>
      ) : (
        <AddSellerForm
          onAdded={() => {
            setAdding(false);
            setSuccess("Vendedor agregado");
            loadSellers();
          }}
          onCancel={() => setAdding(false)}
          onError={(msg) => setError(msg)}
        />
      )}

      {loading ? (
        <p className="text-jet/50 text-sm">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {sellers.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 bg-pearl rounded-lg border border-gold-200/30"
            >
              <span className="text-jet font-medium">{s.name}</span>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`¿Eliminar "${s.name}" de la lista de vendedores?`)) return;
                  try {
                    const res = await fetch(`/api/sellers/${s.id}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || "Error");
                    }
                    setSuccess("Vendedor eliminado");
                    loadSellers();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Error");
                  }
                }}
                className="text-danger text-sm hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))}
          {sellers.length === 0 && !loading && (
            <p className="text-jet/50 text-sm">No hay vendedores.</p>
          )}
        </div>
      )}

      <SellerMergeSection
        onMerged={() => {
          setSuccess("Nombres unificados");
          loadSellers();
        }}
        onError={(msg) => setError(msg)}
      />
    </div>
  );
}

/**
 * Merge tool: unify variant seller names (e.g. "Marlenys" → "Marlenys Nolasco").
 * Updates all affected sales and optionally adds canonical name to Seller table.
 */
function SellerMergeSection({
  onMerged,
  onError,
}: {
  onMerged: () => void;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [namesFromSales, setNamesFromSales] = useState<NameFromSales[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState<string | null>(null);
  const [mergeTargets, setMergeTargets] = useState<Record<string, string>>({});
  const [mergeConfirm, setMergeConfirm] = useState<{ fromName: string; toName: string } | null>(null);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    Promise.all([
      fetch("/api/sellers/names-from-sales").then((r) => (r.ok ? r.json() : { names: [] })),
      fetch("/api/sellers").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([salesData, sellersData]) => {
        setNamesFromSales(salesData.names ?? []);
        setSellers(Array.isArray(sellersData) ? sellersData : []);
      })
      .catch(() => onError("Error al cargar datos"))
      .finally(() => setLoading(false));
  }, [expanded, onError]);

  const allTargets = [...sellers.map((s) => s.name), ...namesFromSales.map((n) => n.name)]
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .sort((a, b) => a.localeCompare(b, "es"));

  function handleMergeClick(fromName: string, suggestedTarget?: string) {
    const toName = (mergeTargets[fromName] || suggestedTarget)?.trim();
    if (!toName || toName === fromName) {
      onError("Selecciona un nombre destino distinto");
      return;
    }
    setMergeConfirm({ fromName, toName });
  }

  async function performMerge(fromName: string, toName: string) {
    setMergeConfirm(null);
    setMerging(fromName);
    onError("");
    try {
      const res = await fetch("/api/sellers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName, toName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al unificar");
      setNamesFromSales((prev) => {
        const target = prev.find((n) => n.name === toName);
        const from = prev.find((n) => n.name === fromName);
        const rest = prev.filter((n) => n.name !== fromName && n.name !== toName);
        if (target && from) {
          return [...rest, { name: toName, count: target.count + from.count }].sort(
            (a, b) => a.name.localeCompare(b.name, "es")
          );
        }
        return prev.filter((n) => n.name !== fromName);
      });
      setMergeTargets((prev) => {
        const next = { ...prev };
        delete next[fromName];
        return next;
      });
      onMerged();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error");
    } finally {
      setMerging(null);
    }
  }

  return (
    <>
      {mergeConfirm && (
        <ConfirmationModal
          title="Unificar vendedores"
          message={`¿Unificar "${mergeConfirm.fromName}" → "${mergeConfirm.toName}"?\n\nSe actualizarán todas las ventas con "${mergeConfirm.fromName}".`}
          confirmLabel="Unificar"
          cancelLabel="Cancelar"
          variant="default"
          onConfirm={() => performMerge(mergeConfirm.fromName, mergeConfirm.toName)}
          onCancel={() => setMergeConfirm(null)}
        />
      )}
      <div className="mt-8 pt-6 border-t border-gold-200/40">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-jet/80 hover:text-jet text-sm font-medium"
        >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Unificar nombres de vendedores
      </button>
      <p className="text-jet/50 text-xs mt-1 ml-6">
        Une variantes (ej. solo nombre vs nombre completo) para que filtros y reportes sean consistentes.
      </p>

      {expanded && (
        <div className="mt-4 ml-0 p-4 bg-pearl/50 rounded-lg border border-gold-200/30">
          {loading ? (
            <p className="text-jet/50 text-sm">Cargando...</p>
          ) : namesFromSales.length === 0 ? (
            <p className="text-jet/50 text-sm">No hay nombres de vendedores en ventas.</p>
          ) : (
            <div className="space-y-2">
              {namesFromSales.map(({ name, count }) => {
                const targets = allTargets.filter((t) => t !== name);
                const suggested = targets.reduce<string | null>((acc, t) => {
                  const target = getSuggestedMergeTarget(name, t);
                  if (!target || target === name) return acc;
                  return !acc || target.length > acc.length ? target : acc;
                }, null);
                return (
                  <div
                    key={name}
                    className="flex flex-wrap items-center gap-2 p-2 bg-porcelain rounded border border-gold-200/30"
                  >
                    <span className="text-jet font-medium min-w-[140px]">{name}</span>
                    <span className="text-jet/50 text-xs">({count} ventas)</span>
                    <select
                      value={mergeTargets[name] ?? (suggested ?? "")}
                      onChange={(e) =>
                        setMergeTargets((prev) => ({ ...prev, [name]: e.target.value }))
                      }
                      className="bg-white border border-gold-200/50 rounded px-2 py-1.5 text-sm text-black min-w-[180px]"
                    >
                      <option value="">— Unificar en —</option>
                      {targets.map((t) => (
                        <option key={t} value={t}>
                          {t}
                          {suggested === t ? " ✓ sugerido" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleMergeClick(name, suggested ?? undefined)}
                      disabled={
                        merging === name ||
                        !(mergeTargets[name]?.trim() || suggested) ||
                        (mergeTargets[name]?.trim() || suggested) === name
                      }
                      className="bg-aqua-700/80 hover:bg-aqua-700 text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                    >
                      {merging === name ? "Unificando…" : "Unificar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

function AddSellerForm({
  onAdded,
  onCancel,
  onError,
}: {
  onAdded: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      onError("Nombre requerido");
      return;
    }
    setSubmitting(true);
    onError("");
    try {
      const res = await fetch("/api/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al agregar");
      onAdded();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 p-4 bg-pearl rounded-lg border border-gold-200/30 mb-6"
    >
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs text-jet/70 mb-1">Nombre del vendedor</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-porcelain border border-gold-200/50 rounded px-3 py-2 text-sm"
          placeholder="Ej: Juan Pérez"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-aqua-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Agregando..." : "Agregar"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="bg-jet/10 text-jet px-4 py-2 rounded text-sm"
      >
        Cancelar
      </button>
    </form>
  );
}
