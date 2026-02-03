"use client";

import { useState, useEffect, useCallback } from "react";

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

  /** Clears the offer image (single image, same pattern as tours remove). */
  const handleRemoveImage = () => {
    setForm((f) => ({ ...f, imageUrl: "" }));
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

  /** Shared form fields (tours-style layout). Used in both create card and edit modal. */
  const formFields = (
    <>
      <div className="mobile-landscape:col-span-2 tablet:col-span-2">
        <label htmlFor="offer-title" className="block text-sm font-medium text-jet/80 mb-1.5">Título</label>
        <input
          id="offer-title"
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px]"
        />
      </div>
      <div className="mobile-landscape:col-span-2 tablet:col-span-2">
        <label htmlFor="offer-description" className="block text-sm font-medium text-jet/80 mb-1.5">Descripción</label>
        <textarea
          id="offer-description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
          rows={3}
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 resize-y"
        />
      </div>
      <div className="mobile-landscape:col-span-2 tablet:col-span-2">
        <label htmlFor="offer-linkUrl" className="block text-sm font-medium text-jet/80 mb-1.5">URL del enlace</label>
        <input
          id="offer-linkUrl"
          type="url"
          value={form.linkUrl}
          onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
          required
          placeholder="https://..."
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px]"
        />
      </div>
      <div className="mobile-landscape:col-span-2 tablet:col-span-2">
        <label className="block text-sm font-medium text-jet/80 mb-1.5">
          Imagen (opcional)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.imageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="" className="w-24 h-24 object-cover rounded-lg border border-gold-200/50" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-1 -right-1 bg-danger text-white w-5 h-5 rounded-full text-xs flex items-center justify-center hover:bg-danger/80"
                aria-label="Eliminar imagen"
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gold-200 rounded-lg cursor-pointer hover:border-aqua-500 transition-colors bg-pearl">
          <div className="flex flex-col items-center justify-center py-4">
            <svg className="w-6 h-6 mb-1 text-jet/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-jet/60"><span className="text-aqua-700 font-medium">Subir imagen</span></p>
            <p className="text-xs text-jet/40 mt-1">PNG, JPG, WebP (máx. 5MB)</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
        {uploadingImage && <p className="text-jet/50 text-xs mt-1">Subiendo...</p>}
        <div className="mt-2">
          <label htmlFor="offer-imageUrl" className="block text-xs font-medium text-jet/60 mb-1">o pega URL</label>
          <input
            id="offer-imageUrl"
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500"
          />
        </div>
      </div>
      <div>
        <label htmlFor="offer-price" className="block text-sm font-medium text-jet/80 mb-1.5">Precio (RD$, opcional)</label>
        <input
          id="offer-price"
          type="number"
          min={0}
          step={1}
          value={form.price === "" ? "" : form.price}
          onChange={(e) => {
            const v = e.target.value;
            setForm((f) => ({ ...f, price: v === "" ? "" : (parseInt(v, 10) || 0) }));
          }}
          placeholder="Ej. 1500"
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px] max-w-[12rem]"
        />
      </div>
      <div>
        <label htmlFor="offer-sequence" className="block text-sm font-medium text-jet/80 mb-1.5">Orden</label>
        <input
          id="offer-sequence"
          type="number"
          min={0}
          value={form.sequence}
          onChange={(e) => setForm((f) => ({ ...f, sequence: parseInt(e.target.value, 10) || 0 }))}
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px] max-w-[8rem]"
        />
      </div>
      <div className="mobile-landscape:col-span-2 tablet:col-span-2">
        <label htmlFor="offer-validFrom" className="block text-sm font-medium text-jet/80 mb-1.5">Válida desde (opcional)</label>
        <input
          id="offer-validFrom"
          type="datetime-local"
          value={form.validFrom}
          onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px]"
        />
      </div>
      <div className="mobile-landscape:col-span-2 tablet:col-span-2">
        <label htmlFor="offer-validUntil" className="block text-sm font-medium text-jet/80 mb-1.5">Válida hasta (opcional)</label>
        <input
          id="offer-validUntil"
          type="datetime-local"
          value={form.validUntil}
          onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px]"
        />
      </div>
      <div className="mobile-landscape:col-span-2 tablet:col-span-2 flex items-center gap-2">
        <input
          type="checkbox"
          id="offer-active"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="rounded border-gold-200 text-aqua-600 focus:ring-aqua-500 h-4 w-4"
        />
        <label htmlFor="offer-active" className="text-sm text-jet/80">Activa</label>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col landscape:flex-row landscape:justify-between landscape:items-center tablet:flex-row tablet:justify-between tablet:items-center gap-3">
        <h2 className="text-lg tablet:text-xl font-semibold text-jet">
          Ofertas de hoteles
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm font-semibold min-h-[44px]"
        >
          + Nueva oferta
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Create form: inline card (tours-style) */}
      {isCreating && (
        <div className="bg-porcelain rounded-xl border border-gold-200/50 shadow-sm p-4 tablet:p-5 tablet-lg:p-6">
          <h3 className="text-lg font-semibold text-jet mb-4">Nueva oferta</h3>
          <form
            onSubmit={handleSubmit}
            className="grid mobile-landscape:grid-cols-2 tablet:grid-cols-2 gap-3 tablet:gap-4"
          >
            {formFields}
            <div className="mobile-landscape:col-span-2 tablet:col-span-2 flex flex-col-reverse landscape:flex-row tablet:flex-row gap-3 landscape:justify-end tablet:justify-end mt-2">
              <button
                type="button"
                onClick={closeForm}
                className="bg-jet/5 hover:bg-jet/10 border border-jet/20 text-jet w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm min-h-[44px] transition-colors"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm font-semibold min-h-[44px]">
                Crear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit form: modal (tours-style) */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jet/50"
          onClick={closeForm}
        >
          <div
            className="bg-porcelain rounded-xl border border-gold-200/50 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gold-200/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-jet">Editar oferta</h3>
              <button
                type="button"
                onClick={closeForm}
                className="text-jet/60 hover:text-jet p-1 text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-4">
              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm mb-4">
                  {error}
                </div>
              )}
              <form
                onSubmit={handleSubmit}
                className="grid mobile-landscape:grid-cols-2 tablet:grid-cols-2 gap-3 tablet:gap-4"
              >
                {formFields}
                <div className="mobile-landscape:col-span-2 tablet:col-span-2 flex flex-col-reverse landscape:flex-row tablet:flex-row gap-3 landscape:justify-end tablet:justify-end mt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="bg-jet/5 hover:bg-jet/10 border border-jet/20 text-jet w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm min-h-[44px] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm font-semibold min-h-[44px]">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
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
