import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { UpdateBatchItemsSchema, formatZodError } from "@/lib/validation";

/**
 * GET /api/sales/[batchId]
 * Returns sales for a single batch (invoice).
 * Requires admin authentication.
 * @returns JSON array of sale records with product info.
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
      where: { batchId, ...supervisorFilter },
      include: { tour: true },
      orderBy: { createdAt: "asc" },
    });

    if (sales.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json(sales);
  } catch (err) {
    console.error("Error fetching batch:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch batch" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sales/[batchId]
 * Updates batch items (edit invoice: add/update/remove lines, change quantity/price).
 * Requires admin authentication.
 * Body: { items: [{ id?: string, tourId, quantity, total, abono?, pendiente? }] }.
 * - id present: update existing sale row (adjust product stock/sold by delta).
 * - id absent: add new sale row (decrement product stock / increment sold).
 * - Existing sale not in items: remove row (restore product stock / decrement sold).
 * Stock -1 (always available) is never changed.
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

    const body = await request.json().catch(() => ({}));
    const parsed = UpdateBatchItemsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { items: newItems } = parsed.data;
    const currentSales = await db.sale.findMany({
      where: { batchId, ...supervisorFilter },
      select: {
        id: true,
        tourId: true,
        quantity: true,
        total: true,
        abono: true,
        pendiente: true,
        voidedAt: true,
      },
    });

    if (currentSales.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    if (currentSales.some((s) => s.voidedAt)) {
      return NextResponse.json(
        { error: "Cannot edit a voided invoice" },
        { status: 400 }
      );
    }

    const currentById = new Map(currentSales.map((s) => [s.id, s]));
    const idsInBody = new Set(newItems.map((i) => i.id).filter(Boolean));

    await db.$transaction(async (tx) => {
      for (let index = 0; index < newItems.length; index++) {
        const item = newItems[index];
        if (item.id && currentById.has(item.id)) {
          const existing = currentById.get(item.id)!;
          const deltaQty = item.quantity - existing.quantity;
          const product = await tx.tour.findUnique({
            where: { id: item.tourId },
            select: { stock: true },
          });
          if (!product) {
            throw new Error(`Product not found: ${item.tourId}`);
          }
          if (product.stock !== -1 && deltaQty > 0 && product.stock < deltaQty) {
            throw new Error(`Insufficient stock for update`);
          }

          await tx.sale.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity,
              total: item.total,
              abono: item.abono ?? null,
              pendiente: item.pendiente ?? null,
            },
          });

          if (product.stock !== -1 && deltaQty !== 0) {
            await tx.tour.update({
              where: { id: item.tourId },
              data: {
                stock: { [deltaQty > 0 ? "decrement" : "increment"]: Math.abs(deltaQty) },
                sold: { [deltaQty > 0 ? "increment" : "decrement"]: Math.abs(deltaQty) },
              },
            });
          }
          continue;
        }

        if (!item.id) {
          const product = await tx.tour.findUnique({
            where: { id: item.tourId },
            select: { stock: true },
          });
          if (!product) {
            throw new Error(`Product not found: ${item.tourId}`);
          }
          if (product.stock !== -1 && product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.tourId}`);
          }

          const template = await tx.sale.findFirst({
            where: { batchId },
            select: {
              customerName: true,
              customerPhone: true,
              cedula: true,
              provincia: true,
              municipio: true,
              customerAddress: true,
              notes: true,
              fechaEntrega: true,
              fechaVisita: true,
              supervisor: true,
              nombreVendedor: true,
              isPaid: true,
            },
          });
          const customerData = template ?? {};

          await tx.sale.create({
            data: {
              batchId,
              tourId: item.tourId,
              quantity: item.quantity,
              total: item.total,
              abono: item.abono ?? null,
              pendiente: item.pendiente ?? null,
              ...customerData,
            },
          });

          if (product.stock !== -1) {
            await tx.tour.update({
              where: { id: item.tourId },
              data: {
                stock: { decrement: item.quantity },
                sold: { increment: item.quantity },
              },
            });
          }
        }
      }

      for (const sale of currentSales) {
        if (!idsInBody.has(sale.id)) {
          const product = await tx.tour.findUnique({
            where: { id: sale.tourId },
            select: { stock: true },
          });
          if (product?.stock !== -1) {
            await tx.tour.update({
              where: { id: sale.tourId },
              data: {
                stock: { increment: sale.quantity },
                sold: { decrement: sale.quantity },
              },
            });
          }
          await tx.sale.delete({ where: { id: sale.id } });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Batch updated" });
  } catch (err) {
    console.error("Error updating batch:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update batch" },
      { status: 500 }
    );
  }
}
