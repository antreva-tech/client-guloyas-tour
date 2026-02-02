import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { z } from "zod";

const TrackContactSchema = z.object({
  type: z.enum(["whatsapp", "call"]),
});

/**
 * PATCH /api/sales/[batchId]/track-contact
 * Increments WhatsApp or call count for an invoice batch.
 * Requires supervisor or above authentication.
 * @param request - Body: { type: "whatsapp" | "call" }
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
    const parsed = TrackContactSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'whatsapp' or 'call'" },
        { status: 400 }
      );
    }

    const saleExists = await db.sale.findFirst({
      where: { batchId, ...supervisorFilter },
    });
    if (!saleExists) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const isWhatsapp = parsed.data.type === "whatsapp";

    const tracking = await db.invoiceContactTracking.upsert({
      where: { batchId },
      create: {
        batchId,
        whatsappCount: isWhatsapp ? 1 : 0,
        callCount: isWhatsapp ? 0 : 1,
      },
      update: isWhatsapp
        ? { whatsappCount: { increment: 1 } }
        : { callCount: { increment: 1 } },
    });

    return NextResponse.json({
      whatsappCount: tracking.whatsappCount,
      callCount: tracking.callCount,
    });
  } catch (error) {
    console.error("Error tracking contact:", error);
    return NextResponse.json(
      { error: "Failed to track contact" },
      { status: 500 }
    );
  }
}
