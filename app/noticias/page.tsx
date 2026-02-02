import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { brandConfig } from "@/lib/brandConfig";

export const metadata: Metadata = {
  title: `Noticias | ${brandConfig.brandName}`,
  description: "Últimas noticias y novedades.",
};

/**
 * Noticias index: list all published news posts.
 */
export default async function NoticiasPage() {
  const posts = await db.newsPost.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-brand-canvas">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-8">
          Noticias
        </h1>
        {posts.length === 0 ? (
          <p className="text-brand-muted">No hay noticias publicadas.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="bg-white rounded-xl border border-brand-border p-5 hover:border-brand-sunset/50 transition-colors">
                  <h2 className="font-semibold text-brand-ink text-lg mb-2">
                    <Link href={`/noticias/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-brand-muted text-sm line-clamp-2 mb-3">
                    {post.excerpt || post.content.slice(0, 200)}
                    {(post.excerpt || post.content).length > 200 ? "…" : ""}
                  </p>
                  <Link
                    href={`/noticias/${post.slug}`}
                    className="text-brand-sunset hover:underline font-medium text-sm"
                  >
                    Leer más →
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-10">
          <Link href="/" className="text-brand-sunset hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
