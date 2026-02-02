import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiSessionContext, requireAdminOrSupport } from "@/lib/apiAuth";
import { z } from "zod";

const UpdateNewsPostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/news/[id]
 * Single post. Public if published; admin can get any.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getApiSessionContext();
    const isAdmin = session.isValid && (session.role === "admin" || session.role === "support");

    const post = await db.newsPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!post.isPublished && !isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("News get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news post" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/news/[id]
 * Update post. Admin/support only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateNewsPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.slug) {
      const existing = await db.newsPost.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Ya existe un artículo con ese slug" }, { status: 400 });
      }
    }

    const update: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string | null;
      isPublished?: boolean;
      publishedAt?: Date | null;
    } = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.slug !== undefined) update.slug = data.slug;
    if (data.content !== undefined) update.content = data.content;
    if (data.excerpt !== undefined) update.excerpt = data.excerpt;
    if (data.isPublished !== undefined) update.isPublished = data.isPublished;
    if (data.publishedAt !== undefined) {
      update.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    } else if (data.isPublished === true) {
      const current = await db.newsPost.findUnique({ where: { id }, select: { publishedAt: true } });
      if (current && !current.publishedAt) update.publishedAt = new Date();
    }

    const post = await db.newsPost.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("News update error:", error);
    return NextResponse.json(
      { error: "Failed to update news post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/news/[id]
 * Delete post. Admin/support only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { id } = await params;
    await db.newsPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("News delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete news post" },
      { status: 500 }
    );
  }
}
