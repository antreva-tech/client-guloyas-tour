import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { brandConfig } from "@/lib/brandConfig";
import { formatDate } from "@/lib/formatDate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Single news post by slug. Returns 404 if not found or not published.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.newsPost.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, excerpt: true },
  });
  if (!post) return { title: brandConfig.brandName };
  return {
    title: `${post.title} | Noticias | ${brandConfig.brandName}`,
    description: post.excerpt || undefined,
  };
}

export default async function NoticiaSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await db.newsPost.findUnique({
    where: { slug, isPublished: true },
  });

  if (!post) notFound();

  return (
    <main>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/noticias" className="text-brand-sunset hover:underline text-sm mb-6 inline-block">
          ← Noticias
        </Link>
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink">
            {post.title}
          </h1>
          {post.publishedAt && (
            <time
              dateTime={new Date(post.publishedAt).toISOString()}
              className="text-brand-muted text-sm mt-2 block"
            >
              {formatDate(post.publishedAt)}
            </time>
          )}
        </header>
        <div className="text-brand-muted whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
        <p className="mt-10">
          <Link href="/" className="text-brand-sunset hover:underline">
            ← Inicio
          </Link>
        </p>
      </article>
    </main>
  );
}
