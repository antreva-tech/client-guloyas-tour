"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export interface NewsPostItem {
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
 * Fetches and displays the latest published news posts.
 * Renders a "Noticias" section with cards linking to full posts at /noticias/[slug].
 */
export function NewsSection() {
  const [posts, setPosts] = useState<NewsPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || posts.length === 0) return null;

  return (
    <section id="noticias" aria-labelledby="news-heading" className="py-12 sm:py-20 bg-brand-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-brand-sky text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Noticias
          </span>
          <h2 id="news-heading" className="text-2xl sm:text-4xl font-bold text-brand-ink mt-2">
            Últimas noticias
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl border border-brand-border overflow-hidden hover:border-brand-sunset/50 transition-colors"
            >
              <div className="p-5 flex flex-col h-full">
                <h3 className="font-semibold text-brand-ink text-lg mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-brand-muted text-sm flex-1 line-clamp-3 mb-4">
                  {post.excerpt || post.content.slice(0, 160)}
                  {(post.excerpt || post.content).length > 160 ? "…" : ""}
                </p>
                <Link
                  href={`/noticias/${post.slug}`}
                  className="text-brand-sunset hover:underline font-medium text-sm"
                >
                  Leer más →
                </Link>
              </div>
            </article>
          ))}
        </div>
        {posts.length >= 6 && (
          <div className="text-center mt-8">
            <Link
              href="/noticias"
              className="inline-flex items-center gap-2 text-brand-sunset hover:underline font-medium"
            >
              Ver todas las noticias
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
