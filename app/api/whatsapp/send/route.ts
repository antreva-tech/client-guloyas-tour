import { NextRequest, NextResponse } from "next/server";
import { requireSupervisorOrAbove } from "@/lib/apiAuth";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { db } from "@/lib/db";
import { z } from "zod";

const SendSchema = z.object({
  to: z.string().min(1, "to is required"),
  message: z.string().min(1, "message is required").max(4096),
});

/**
 * POST /api/whatsapp/send
 * Sends a single WhatsApp text message via Cloud API.
 * Body: { to: string (phone), message: string }
 * Requires supervisor or above.
 */
export async function POST(request: NextRequest) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = SendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }
    const { messageId } = await sendWhatsAppText(parsed.data.to, parsed.data.message);
    await db.whatsAppMessageLog.create({
      data: {
        direction: "outbound",
        externalId: messageId,
        customerPhone: parsed.data.to.replace(/\D/g, ""),
        body: parsed.data.message,
        status: "sent",
      },
    });
    return NextResponse.json({ messageId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
