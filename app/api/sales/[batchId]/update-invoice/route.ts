import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { UpdateInvoiceSchema, formatZodError } from "@/lib/validation";

/**
 * PATCH /api/sales/[batchId]/update-invoice
 * Updates customer and/or sale data for all sales in a batch.
 * Requires supervisor or above. All body fields are optional (partial update).
 * @param request - Body with customer/sale fields to update.
 * @param context - Route context with batchId param.
 */
export async function PATCH(
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
    const parsed = UpdateInvoiceSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const updates = parsed.data;
    const keys = Object.keys(updates) as (keyof typeof updates)[];
    if (keys.length === 0) {
      return NextResponse.json({ message: "Nothing to update" });
    }

    const sales = await db.sale.findMany({
      where: { batchId, ...supervisorFilter },
    });

    if (sales.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (updates.customerName !== undefined) data.customerName = updates.customerName;
    if (updates.customerPhone !== undefined) data.customerPhone = updates.customerPhone;
    if (updates.cedula !== undefined) data.cedula = updates.cedula;
    if (updates.provincia !== undefined) data.provincia = updates.provincia;
    if (updates.municipio !== undefined) data.municipio = updates.municipio;
    if (updates.customerAddress !== undefined) data.customerAddress = updates.customerAddress;
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.fechaEntrega !== undefined) data.fechaEntrega = updates.fechaEntrega ? new Date(updates.fechaEntrega) : null;
    if (updates.fechaVisita !== undefined) data.fechaVisita = updates.fechaVisita ? new Date(updates.fechaVisita) : null;
    if (updates.supervisor !== undefined) data.supervisor = updates.supervisor;
    if (updates.nombreVendedor !== undefined) data.nombreVendedor = updates.nombreVendedor;

    await db.$transaction(async (tx) => {
      for (const sale of sales) {
        await tx.sale.update({
          where: { id: sale.id },
          data,
        });
      }
    });

    return NextResponse.json({ message: "Invoice updated successfully" });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}
