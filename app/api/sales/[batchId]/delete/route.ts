import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport } from "@/lib/apiAuth";

/**
 * DELETE /api/sales/[batchId]/delete
 * Permanently removes a voided (anulada) invoice batch from the database.
 * Admin and support only; used as a review/cleanup process.
 * Only allows deletion when all sales in the batch have voidedAt set.
 *
 * @param _request - Incoming request (no body required).
 * @param context - Route context containing params promise.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { batchId } = await context.params;
    if (!batchId) {
      return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
    }

    const sales = await db.sale.findMany({
      where: { batchId },
      select: { id: true, voidedAt: true },
    });

    if (sales.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const allVoided = sales.every((s) => s.voidedAt);
    if (!allVoided) {
      return NextResponse.json(
        { error: "Only voided (anulada) invoices can be deleted" },
        { status: 400 }
      );
    }

    await db.sale.deleteMany({
      where: { batchId },
    });

    return NextResponse.json({
      message: "Voided invoice deleted permanently",
    });
  } catch (error) {
    console.error("Error deleting voided invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
