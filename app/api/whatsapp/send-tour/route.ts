import { NextRequest, NextResponse } from "next/server";
import { requireSupervisorOrAbove } from "@/lib/apiAuth";
import { sendWhatsAppText, normalizePhone } from "@/lib/whatsapp";
import { db } from "@/lib/db";
import { z } from "zod";

const SendTourSchema = z.object({
  tourId: z.string().min(1, "tourId is required"),
  message: z.string().min(1, "message is required").max(4096),
});

/** Delay between sends to avoid rate limit (ms). */
const THROTTLE_MS = 150;

/**
 * POST /api/whatsapp/send-tour
 * Sends the same WhatsApp message to each distinct customer who booked the given tour.
 * Body: { tourId: string, message: string }
 * Requires supervisor or above. Sends one message per phone; skips empty phones.
 */
export async function POST(request: NextRequest) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = SendTourSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }
    const { tourId, message } = parsed.data;

    const sales = await db.sale.findMany({
      where: { tourId, voidedAt: null, customerPhone: { not: null } },
      select: { customerPhone: true },
    });
    const phones = [...new Set(sales.map((s) => normalizePhone(s.customerPhone ?? "")).filter(Boolean))];
    if (phones.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, error: "No customers with phone for this tour" });
    }

    let sent = 0;
    let failed = 0;
    for (const phone of phones) {
      try {
        await sendWhatsAppText(phone, message);
        sent++;
      } catch {
        failed++;
      }
      if (phones.indexOf(phone) < phones.length - 1) {
        await new Promise((r) => setTimeout(r, THROTTLE_MS));
      }
    }
    return NextResponse.json({ sent, failed, total: phones.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send tour messages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
