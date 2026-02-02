import { NextRequest, NextResponse } from "next/server";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { db } from "@/lib/db";
import { buildInvoiceFromSales, generateInvoicePdf } from "@/lib/invoicePdf";
import { brandConfig } from "@/lib/brandConfig";

/**
 * GET /api/invoices/[batchId]/pdf
 * Returns a clean, concise PDF invoice for the given batch.
 * Requires supervisor or above. Respects supervisor filter (only own batches).
 */
export async function GET(
  _request: NextRequest,
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

    const sales = await db.sale.findMany({
      where: { batchId, voidedAt: null, ...supervisorFilter },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    });
    if (sales.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const invoice = buildInvoiceFromSales(sales, batchId);

    const pdfBuffer = generateInvoicePdf(invoice, brandConfig.logoPath);
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Factura-${batchId.slice(0, 10)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error generating invoice PDF:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
