"use client";

import { useState, useEffect, useCallback } from "react";

export interface NewsPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Slug from title: lowercase, replace spaces with hyphens, strip non-alphanumeric.
 */
function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Admin section to list, create, edit, and delete news posts.
 */
export function NewsManagementSection() {
  const [posts, setPosts] = useState<NewsPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    isPublished: false,
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news?admin=true", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar noticias");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const openCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setForm({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      isPublished: false,
    });
  };

  const openEdit = (post: NewsPostRow) => {
    setIsCreating(false);
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      isPublished: post.isPublished,
    });
  };

  const closeForm = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      ...(isCreating && !editingId ? { slug: slugFromTitle(title) } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      excerpt: form.excerpt || undefined,
    };
    if (editingId) {
      const res = await fetch(`/api/news/${editingId}`, {
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
      loadPosts();
    } else {
      const res = await fetch("/api/news", {
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
      loadPosts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    const res = await fetch(`/api/news/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setError("Error al eliminar");
      return;
    }
    if (editingId === id) closeForm();
    loadPosts();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg tablet:text-xl font-semibold text-jet">
          Noticias
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto"
        >
          + Nueva noticia
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
            {editingId ? "Editar noticia" : "Nueva noticia"}
          </h3>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Slug (URL)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
              pattern="^[a-z0-9-]+$"
              title="Solo minúsculas, números y guiones"
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Extracto (opcional)</label>
            <input
              type="text"
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-jet/70 mb-1">Contenido</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              required
              rows={6}
              className="w-full border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="news-published"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="rounded border-gold-200/50"
            />
            <label htmlFor="news-published" className="text-sm text-jet">
              Publicado
            </label>
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
      ) : posts.length === 0 ? (
        <p className="text-jet/60 text-sm">No hay noticias. Crea una para que aparezca en la sección Noticias del sitio.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li
              key={post.id}
              className="bg-porcelain rounded-xl border border-gold-200/50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-jet truncate">{post.title}</p>
                <p className="text-xs text-jet/60">
                  /{post.slug}
                  {post.isPublished ? " · Publicado" : " · Borrador"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(post)}
                  className="text-aqua-700 hover:underline text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
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
