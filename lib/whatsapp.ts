/**
 * WhatsApp Business Cloud API helpers.
 * Sends text messages via Meta Graph API. Requires env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN.
 */

const GRAPH_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Normalizes phone to E.164 digits only (no + or spaces).
 * @param phone - Raw phone (e.g. 18297188926 or +1 829 718-8926).
 * @returns Digits only.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Sends a text message via WhatsApp Cloud API.
 * @param to - Recipient phone (digits only or will be normalized).
 * @param body - Message text (max 4096 chars).
 * @returns Meta message ID or throws.
 */
export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<{ messageId: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp API not configured (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)");
  }
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    throw new Error("Invalid recipient phone");
  }
  const url = `${BASE_URL}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: { body: body.slice(0, 4096) },
    }),
  });
  const data = (await res.json()) as { error?: { message: string; code: number }; messages?: Array<{ id: string }> };
  if (!res.ok) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const messageId = data.messages?.[0]?.id;
  if (!messageId) {
    throw new Error("No message ID in response");
  }
  return { messageId };
}

/**
 * Checks if WhatsApp Cloud API is configured (env vars set).
 */
export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}
