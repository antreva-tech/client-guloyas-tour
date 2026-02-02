import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/whatsapp/webhook
 * Webhook verification: Meta sends hub.mode=subscribe, hub.verify_token, hub.challenge.
 * Respond with hub.challenge if verify_token matches WHATSAPP_VERIFY_TOKEN.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Handles incoming webhook events (messages, status updates).
 * Optionally logs to WhatsAppMessageLog for message interactions view.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      object?: string;
      entry?: Array<{
        id?: string;
        changes?: Array<{
          value?: {
            messaging_product?: string;
            metadata?: { phone_number_id?: string };
            contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
            messages?: Array<{
              id: string;
              from: string;
              timestamp: string;
              type: string;
              text?: { body: string };
            }>;
            statuses?: Array<{
              id: string;
              recipient_id: string;
              status: "sent" | "delivered" | "read" | "failed";
              timestamp: string;
            }>;
          };
          field?: string;
        }>;
      }>;
    };
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ ok: true });
    }
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value || value.messaging_product !== "whatsapp") continue;
        for (const msg of value.messages ?? []) {
          await db.whatsAppMessageLog.create({
            data: {
              direction: "inbound",
              externalId: msg.id,
              customerPhone: msg.from,
              body: msg.text?.body ?? null,
              status: "delivered",
            },
          });
        }
        for (const status of value.statuses ?? []) {
          await db.whatsAppMessageLog.updateMany({
            where: { externalId: status.id },
            data: { status: status.status },
          });
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
