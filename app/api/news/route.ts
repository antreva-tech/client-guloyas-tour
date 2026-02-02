import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiSessionContext, requireAdminOrSupport } from "@/lib/apiAuth";
import { z } from "zod";

/**
 * Schema for creating a news post.
 */
const CreateNewsPostSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  slug: z.string().min(1, "Slug requerido").regex(/^[a-z0-9-]+$/, "Slug: solo minúsculas, números y guiones"),
  content: z.string().min(1, "Contenido requerido"),
  excerpt: z.string().optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/news
 * List news posts. Public: published only. Admin: ?admin=true returns all.
 * Query: slug=xxx returns single post by slug (public, published only).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";
    const slug = searchParams.get("slug");

    if (slug) {
      const post = await db.newsPost.findUnique({
        where: { slug, isPublished: true },
      });
      if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(post);
    }

    const session = await getApiSessionContext();
    const isAdmin = session.isValid && (session.role === "admin" || session.role === "support");

    const where = admin && isAdmin ? {} : { isPublished: true };

    const posts = await db.newsPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("News list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news
 * Create a news post. Admin/support only.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = CreateNewsPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const { title, slug, content, excerpt, isPublished, publishedAt } = parsed.data;

    const existing = await db.newsPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un artículo con ese slug" }, { status: 400 });
    }

    const post = await db.newsPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt ?? null,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : isPublished ? new Date() : null,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("News create error:", error);
    return NextResponse.json(
      { error: "Failed to create news post" },
      { status: 500 }
    );
  }
}
