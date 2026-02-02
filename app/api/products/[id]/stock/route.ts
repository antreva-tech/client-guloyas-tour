import { NextRequest, NextResponse } from "next/server";
import { updateStock, recordSale } from "@/lib/products";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/products/[id]/stock
 * Updates product stock or records a sale.
 * Requires admin authentication.
 *
 * Body options:
 * - { stock: number } - Sets absolute stock value
 * - { sold: number } - Records a sale and decrements stock
 *
 * @param request - The incoming request with stock data.
 * @param params - Route parameters containing the product ID.
 * @returns The updated product.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Handle absolute stock update
    if (typeof body.stock === "number") {
      const product = await updateStock(id, body.stock);
      return NextResponse.json(product);
    }

    // Handle sale recording
    if (typeof body.sold === "number") {
      const product = await recordSale(id, body.sold);
      return NextResponse.json(product);
    }

    return NextResponse.json(
      { error: "Provide either stock or sold quantity" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating stock:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update stock";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
