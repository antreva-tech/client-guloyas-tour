"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface HotelOfferRow {
  id: string;
  title: string;
  description: string;
  linkUrl: string;
  imageUrl: string | null;
  price: number | null;
  validFrom: string | null;
  validUntil: string | null;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin section to list, create, edit, and delete hotel offers.
 */
export function HotelOffersManagementSection() {
  const [offers, setOffers] = useState<HotelOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    linkUrl: "",
    imageUrl: "",
    price: "" as number | "",
    validFrom: "",
    validUntil: "",
    sequence: 0,
    isActive: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hotel-offers?admin=true", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar ofertas");
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const openCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setForm({
      title: "",
      description: "",
      linkUrl: "",
      imageUrl: "",
      price: "",
      validFrom: "",
      validUntil: "",
      sequence: 0,
      isActive: true,
    });
  };

  const openEdit = (offer: HotelOfferRow) => {
    setIsCreating(false);
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description,
      linkUrl: offer.linkUrl,
      imageUrl: offer.imageUrl || "",
      price: offer.price ?? "",
      validFrom: offer.validFrom ? offer.validFrom.slice(0, 16) : "",
      validUntil: offer.validUntil ? offer.validUntil.slice(0, 16) : "",
      sequence: offer.sequence,
      isActive: offer.isActive,
    });
  };

  /** Uploads image to /api/upload with prefix hotel-offers and sets form.imageUrl. */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "hotel-offers");
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al subir");
      }
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const closeForm = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      linkUrl: form.linkUrl,
      imageUrl: form.imageUrl || null,
      price: form.price === "" || form.price === undefined ? null : Number(form.price),
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      sequence: form.sequence,
      isActive: form.isActive,
    };
    if (editingId) {
      const res = await fetch(`/api/hotel-offers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al actualizar");
        return;
      }
      closeForm();
      loadOffers();
    } else {
      const res = await fetch("/api/hotel-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al crear");
        return;
      }
      closeForm();
      loadOffers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta oferta?")) return;
    const res = await fetch(`/api/hotel-offers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setError("Error al eliminar");
      return;
    }
    if (editingId === id) closeForm();
    loadOffers();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg tablet:text-xl font-semibold text-jet">
          Ofertas de hoteles
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto"
        >
          + Nueva oferta
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-2 text-danger text-sm">
          {error}
        </div>
      )}

      {(isCreating || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="bg-porcelain rounded-xl border border-gold-200/50 p-4 space-y-3"
        >
          <h3 className="font-semibold text-jet">
            {editingId ? "Editar oferta" : "Nueva oferta"}
          </h3>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              rows={2}
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">URL del enlace</label>
            <input
              type="url"
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              required
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Imagen (opcional)</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="bg-jet/10 text-jet px-3 py-2 rounded-lg text-sm hover:bg-jet/20 disabled:opacity-50"
                >
                  {uploadingImage ? "Subiendo…" : "Subir imagen"}
                </button>
                <span className="text-jet/60 text-xs">o pega URL:</span>
              </div>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
              />
              {form.imageUrl ? (
                <div className="relative h-24 w-40 rounded-lg overflow-hidden bg-jet/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Precio (RD$, opcional)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.price === "" ? "" : form.price}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, price: v === "" ? "" : (parseInt(v, 10) || 0) }));
              }}
              placeholder="Ej. 1500"
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm max-w-[12rem]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-jet/70 mb-1">Válida desde (opcional)</label>
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-jet/70 mb-1">Válida hasta (opcional)</label>
              <input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-jet">Orden</label>
              <input
                type="number"
                min={0}
                value={form.sequence}
                onChange={(e) => setForm((f) => ({ ...f, sequence: parseInt(e.target.value, 10) || 0 }))}
                className="w-20 border border-gold-200/50 rounded-lg px-2 py-1 text-jet text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="offer-active"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-gold-200/50"
              />
              <label htmlFor="offer-active" className="text-sm text-jet">Activa</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary px-4 py-2 rounded-lg text-sm">
              {editingId ? "Guardar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="bg-jet/10 text-jet px-4 py-2 rounded-lg text-sm hover:bg-jet/20"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-jet/60 text-sm">Cargando…</p>
      ) : offers.length === 0 ? (
        <p className="text-jet/60 text-sm">No hay ofertas. Crea una para que aparezca en la sección Ofertas de hoteles del sitio.</p>
      ) : (
        <ul className="space-y-2">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="bg-porcelain rounded-xl border border-gold-200/50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-jet truncate">{offer.title}</p>
                <p className="text-xs text-jet/60">
                  Orden {offer.sequence} · {offer.isActive ? "Activa" : "Inactiva"}
                  {offer.price != null ? ` · RD$ ${offer.price.toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(offer)}
                  className="text-aqua-700 hover:underline text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(offer.id)}
                  className="text-danger hover:underline text-sm"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
