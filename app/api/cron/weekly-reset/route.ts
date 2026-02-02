import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runWeeklyRecurringReset } from "@/lib/weeklyReset";

/**
 * Performs timing-safe comparison of two strings.
 * @param a - First string.
 * @param b - Second string.
 * @returns True if strings match, false otherwise.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * POST /api/cron/weekly-reset
 * Resets seats and advances tourDate for tours with recurringWeeklyDay whose date has passed.
 * Secured by CRON_SECRET. Run daily (e.g. 01:00 UTC).
 * @param request - Incoming cron request with Bearer token.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization") || "";

    if (!secret) {
      console.error("CRON_SECRET environment variable is not set");
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const expectedAuth = `Bearer ${secret}`;
    if (!safeCompare(authHeader, expectedAuth)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resetCount = await runWeeklyRecurringReset();
    return NextResponse.json({ ok: true, resetCount }, { status: 200 });
  } catch (error) {
    console.error("Cron weekly-reset error:", error);
    return NextResponse.json(
      { error: "Error al ejecutar el reinicio semanal de plazas" },
      { status: 500 }
    );
  }
}
