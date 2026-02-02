import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { IMPORT_ONLY_PRODUCT_NAME } from "@/lib/products";
import { CreateSaleSchema, formatZodError } from "@/lib/validation";

/**
 * Default pagination values for sales.
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/sales
 * Retrieves sales with optional date filtering and pagination.
 * Requires admin authentication.
 * Query params:
 *   - month: MM (optional)
 *   - year: YYYY (optional)
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 50, max 100)
 * @returns JSON array of sales or paginated response.
 */
export async function GET(request: NextRequest) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  const session = await getApiSessionContext();
  const supervisorFilter =
    session.role === "supervisor" && session.supervisorName
      ? { supervisor: session.supervisorName }
      : {};

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? String(DEFAULT_PAGE), 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)));
    const usePagination = searchParams.has("page") || searchParams.has("limit");

    const whereClause: Record<string, unknown> = { ...supervisorFilter };

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Use pagination when page/limit params are provided
    if (usePagination) {
      const skip = (page - 1) * limit;

      const [sales, total] = await Promise.all([
        db.sale.findMany({
          where: whereClause,
          include: { tour: true },
          orderBy: [{ batchId: "asc" }, { createdAt: "asc" }],
          skip,
          take: limit,
        }),
        db.sale.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        data: sales,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    }

    // Legacy non-paginated response for backward compatibility (ordered by batch then line order)
    const sales = await db.sale.findMany({
      where: whereClause,
      include: { tour: true },
      orderBy: [{ batchId: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      data: sales,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch sales";
    return NextResponse.json(
      { error: "Failed to fetch sales", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sales
 * Creates a new sale transaction.
 * Requires admin authentication.
 * Updates product stock and sold counts.
 * @param request - Request with sale items and customer info.
 * @returns The created sale ID and details.
 */
export async function POST(request: NextRequest) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate input with Zod schema
    const parsed = CreateSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const {
      items,
      customerName,
      customerPhone,
      cedula,
      provincia,
      municipio,
      customerAddress,
      notes,
      fechaVisita,
      isPaid,
    } = parsed.data;
    const supervisor = parsed.data.supervisor?.trim() || null;
    const nombreVendedor = parsed.data.nombreVendedor?.trim() || null;

    // Validate stock availability and sellability for all items
    for (const item of items) {
      const tour = await db.tour.findUnique({
        where: { id: item.tourId },
      });

      if (!tour) {
        return NextResponse.json(
          { error: `Tour not found: ${item.tourId}` },
          { status: 400 }
        );
      }

      if (tour.name === IMPORT_ONLY_PRODUCT_NAME) {
        return NextResponse.json(
          { error: `${IMPORT_ONLY_PRODUCT_NAME} is for import only and cannot be sold.` },
          { status: 400 }
        );
      }

      if (tour.stock !== -1 && tour.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${tour.name}. Available: ${tour.stock}` },
          { status: 400 }
        );
      }
    }

    // Reservation date = creation time; tour date from request
    const reservationDate = new Date();
    const visitDate = new Date(fechaVisita);

    // Create sale records and update products in a transaction
    const result = await db.$transaction(async (tx) => {
      const saleRecords = [];
      
      // Create a unique sale batch ID
      const batchId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (const item of items) {
        // Create sale record with all customer and sale fields
        const sale = await tx.sale.create({
          data: {
            batchId,
            tourId: item.tourId,
            quantity: item.quantity,
            total: item.total,
            abono: item.abono ?? null,
            pendiente: item.pendiente ?? null,
            customerName,
            customerPhone,
            cedula: cedula?.trim() || null,
            provincia: provincia?.trim() || null,
            municipio: municipio?.trim() || null,
            customerAddress: customerAddress || null,
            notes: notes || null,
            fechaEntrega: reservationDate,
            fechaVisita: visitDate,
            supervisor,
            nombreVendedor,
            isPaid: isPaid ?? false,
          },
        });

        saleRecords.push(sale);

        // Update product: sold always; stock only when not "always available" (-1)
        const tourForUpdate = await tx.tour.findUnique({ where: { id: item.tourId }, select: { stock: true } });
        await tx.tour.update({
          where: { id: item.tourId },
          data: tourForUpdate?.stock === -1
            ? { sold: { increment: item.quantity } }
            : { stock: { decrement: item.quantity }, sold: { increment: item.quantity } },
        });
      }

      return { batchId, sales: saleRecords };
    });

    return NextResponse.json(
      {
        id: result.batchId,
        salesCount: result.sales.length,
        message: "Sale completed successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to process sale" },
      { status: 500 }
    );
  }
}
