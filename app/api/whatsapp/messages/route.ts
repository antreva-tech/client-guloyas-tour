import { NextRequest, NextResponse } from "next/server";
import { requireSupervisorOrAbove } from "@/lib/apiAuth";
import { db } from "@/lib/db";

/**
 * GET /api/whatsapp/messages
 * Lists WhatsApp message log entries with optional filters: batchId, tourId, customerPhone, limit.
 * Requires supervisor or above.
 */
export async function GET(request: NextRequest) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId") ?? undefined;
    const tourId = searchParams.get("tourId") ?? undefined;
    const customerPhone = searchParams.get("customerPhone") ?? undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

    const list = await db.whatsAppMessageLog.findMany({
      where: {
        ...(batchId && { batchId }),
        ...(tourId && { tourId }),
        ...(customerPhone && { customerPhone: { contains: customerPhone } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(list);
  } catch (err) {
    console.error("Error fetching WhatsApp messages:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
