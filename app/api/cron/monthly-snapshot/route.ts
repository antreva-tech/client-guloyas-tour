import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createMonthlySnapshot } from "@/lib/monthlySnapshot";

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
 * POST /api/cron/monthly-snapshot
 * Creates a monthly snapshot (secured by CRON_SECRET only).
 * Requires Bearer token matching CRON_SECRET environment variable.
 * @param request - Incoming cron request with auth header.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization") || "";

    // Only accept Bearer token authentication - no spoofable headers
    if (!secret) {
      console.error("CRON_SECRET environment variable is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const expectedAuth = `Bearer ${secret}`;
    const isAuthorized = safeCompare(authHeader, expectedAuth);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await createMonthlySnapshot();
    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    console.error("Cron snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
