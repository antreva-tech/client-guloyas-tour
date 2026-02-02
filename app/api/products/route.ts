import { NextRequest, NextResponse } from "next/server";
import {
  getActiveProducts,
  getActiveProductsPaginated,
  getAllProducts,
  getAllProductsPaginated,
  createProduct,
} from "@/lib/products";
import { requireAdminOrSupport } from "@/lib/apiAuth";
import { CreateProductSchema, formatZodError } from "@/lib/validation";

/**
 * GET /api/products
 * Retrieves products with optional pagination.
 * Query params:
 *   - all: "true" for admin to get all products (requires auth)
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 20, max 100)
 *   - paginated: "true" to enable pagination (optional)
 * @param request - The incoming request.
 * @returns JSON array of products or paginated response.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get("all") === "true";
    const usePagination = searchParams.get("paginated") === "true";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    // If requesting all products, require admin authentication
    if (includeAll) {
      const authError = await requireAdminOrSupport();
      if (authError) return authError;
    }

    // Use paginated queries when pagination params are provided
    if (usePagination || searchParams.has("page") || searchParams.has("limit")) {
      const result = includeAll
        ? await getAllProductsPaginated({ page, limit })
        : await getActiveProductsPaginated({ page, limit });

      // Public requests get cache headers for mobile performance
      const headers: HeadersInit = includeAll
        ? {}
        : {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          };

      return NextResponse.json(result, { headers });
    }

    // Legacy non-paginated response for backward compatibility
    const products = includeAll
      ? await getAllProducts()
      : await getActiveProducts();

    // Public requests get cache headers for mobile performance
    // Admin requests (includeAll) are not cached
    const headers: HeadersInit = includeAll
      ? {}
      : {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        };

    return NextResponse.json(products, { headers });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Creates a new product. Requires admin authentication.
 * @param request - The incoming request with product data.
 * @returns The created product.
 */
export async function POST(request: NextRequest) {
  // Require admin authentication
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate input with Zod schema
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const product = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
