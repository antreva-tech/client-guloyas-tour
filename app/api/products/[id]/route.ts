import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/products";
import { requireAdminOrSupport } from "@/lib/apiAuth";
import { UpdateProductSchema, formatZodError } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/products/[id]
 * Retrieves a single product by ID.
 * @param request - The incoming request.
 * @param params - Route parameters containing the product ID.
 * @returns The product or 404 if not found.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Cache single product responses for mobile performance
    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id]
 * Updates a product. Requires admin authentication.
 * @param request - The incoming request with partial product data.
 * @param params - Route parameters containing the product ID.
 * @returns The updated product.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Require admin authentication
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input with Zod schema
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const product = await updateProduct(id, parsed.data);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Permanently deletes a product. Fails if product has sales or is import-only.
 * Requires admin authentication.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { id } = await params;
    const product = await deleteProduct(id);
    return NextResponse.json(product);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete product";
    const status = msg.includes("not found") ? 404 : msg.includes("ventas") || msg.includes("importación") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
