import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { VoidSaleSchema, formatZodError } from "@/lib/validation";

/**
 * POST /api/sales/[batchId]/void
 * Voids a sale batch and restores inventory.
 * Requires admin authentication.
 * @param request - Incoming request with optional void reason.
 * @param context - Route context containing params promise.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  const session = await getApiSessionContext();
  const supervisorFilter =
    session.role === "supervisor" && session.supervisorName
      ? { supervisor: session.supervisorName }
      : {};

  try {
    const { batchId } = await context.params;
    if (!batchId) {
      return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => ({}));
    
    // Validate input with Zod schema
    const parsed = VoidSaleSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    
    const body = parsed.data;

    const sales = await db.sale.findMany({
      where: { batchId, ...supervisorFilter },
    });

    if (sales.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (sales.some((s) => s.voidedAt)) {
      return NextResponse.json(
        { error: "Invoice already voided" },
        { status: 409 }
      );
    }

    await db.$transaction(async (tx) => {
      for (const sale of sales) {
        const tour = await tx.tour.findUnique({
          where: { id: sale.tourId },
        });

        if (!tour) {
          throw new Error(`Tour not found: ${sale.tourId}`);
        }

        const nextSold = Math.max(tour.sold - sale.quantity, 0);
        const wasUnlimited = tour.stock === -1;

        await tx.tour.update({
          where: { id: sale.tourId },
          data: wasUnlimited
            ? { sold: { set: nextSold } }
            : { stock: { increment: sale.quantity }, sold: { set: nextSold } },
        });

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            voidedAt: new Date(),
            voidReason: body.reason?.trim() || null,
          },
        });
      }
    });

    return NextResponse.json({
      message: "Invoice voided and inventory restored",
    });
  } catch (error) {
    console.error("Error voiding sale:", error);
    return NextResponse.json(
      { error: "Failed to void invoice" },
      { status: 500 }
    );
  }
}
