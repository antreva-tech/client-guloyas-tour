import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { z } from "zod";

/**
 * Schema for updating payment status.
 */
const UpdatePaymentSchema = z.object({
  isPaid: z.boolean(),
});

/**
 * PATCH /api/sales/[batchId]/update-payment
 * Updates the payment status for all sales in a batch.
 * Requires admin authentication.
 * @param request - Request with isPaid boolean.
 * @param params - Route params containing batchId.
 * @returns Success message or error.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  const session = await getApiSessionContext();
  const supervisorFilter =
    session.role === "supervisor" && session.supervisorName
      ? { supervisor: session.supervisorName }
      : {};

  try {
    const { batchId } = await params;
    const body = await request.json();

    // Validate input
    const parsed = UpdatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "isPaid must be a boolean" },
        { status: 400 }
      );
    }

    const { isPaid } = parsed.data;

    const existingSales = await db.sale.findMany({
      where: { batchId, ...supervisorFilter },
    });

    if (existingSales.length === 0) {
      return NextResponse.json(
        { error: "Sale batch not found" },
        { status: 404 }
      );
    }

    // Check if batch is voided
    const isVoided = existingSales.some((s) => s.voidedAt !== null);
    if (isVoided) {
      return NextResponse.json(
        { error: "Cannot update payment status of voided invoice" },
        { status: 400 }
      );
    }

    await db.sale.updateMany({
      where: { batchId, ...supervisorFilter },
      data: { isPaid },
    });

    return NextResponse.json({
      success: true,
      message: isPaid ? "Factura marcada como pagada" : "Factura marcada como pendiente",
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
