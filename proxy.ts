import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "retail_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8 * 1000; // 8 hours in ms (match lib/auth.ts)

/**
 * Creates HMAC signature using Web Crypto API.
 * @param data - The data to sign.
 * @param secret - The secret key.
 * @returns The hex-encoded signature.
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * @param a - First string.
 * @param b - Second string.
 * @returns True if strings are equal.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const SESSION_PAYLOAD_DELIMITER = "|";

/**
 * Parses session cookie value into components.
 * Supports legacy (timestamp.signature, timestamp.role.signature) and
 * extended (timestamp|role|supervisorName|userId|mustChangePassword.signature) formats.
 * @param value - The raw cookie value.
 * @returns Parsed components or null if invalid.
 */
function parseSessionCookie(
  value: string
): { payload: string; signature: string } | null {
  const dotParts = value.split(".");
  if (dotParts.length < 2) return null;

  const signature = dotParts.pop();
  if (!signature) return null;
  const payload = dotParts.join(".");

  // Extended format: timestamp|role|supervisorName|userId|mustChangePassword (supervisor)
  if (payload.includes(SESSION_PAYLOAD_DELIMITER)) {
    const segs = payload.split(SESSION_PAYLOAD_DELIMITER);
    if (segs.length >= 2) {
      const [timestamp, role] = segs;
      if (!timestamp || !role) return null;
      if (role !== "admin" && role !== "support" && role !== "supervisor") return null;
      return { payload, signature };
    }
  }

  // Legacy format: timestamp (2 parts) or timestamp.role (3 parts)
  if (dotParts.length === 1) {
    const [timestamp] = dotParts;
    if (!timestamp) return null;
    return { payload, signature };
  }
  if (dotParts.length === 2) {
    const [timestamp, role] = dotParts;
    if (!timestamp || !role) return null;
    if (role !== "admin" && role !== "support") return null;
    return { payload, signature };
  }

  return null;
}

/**
 * Validates session cookie in proxy context.
 * @param request - The incoming request.
 * @returns True if session is valid.
 */
async function isValidSession(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return false;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return false;
  }

  const parsed = parseSessionCookie(sessionCookie.value);
  if (!parsed) {
    return false;
  }

  // Verify signature
  const expectedSignature = await createSignature(parsed.payload, secret);

  if (parsed.signature.length !== expectedSignature.length) {
    return false;
  }

  if (!constantTimeEqual(parsed.signature, expectedSignature)) {
    return false;
  }

  // Check expiration
  const timestamp = parsed.payload.split(".")[0];
  const sessionTime = parseInt(timestamp, 10);
  return Date.now() - sessionTime < SESSION_MAX_AGE;
}

/**
 * Proxy to protect admin routes.
 * Redirects unauthenticated users to login page.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const isAuthenticated = await isValidSession(request);
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * Configure which routes the proxy runs on.
 */
export const config = {
  matcher: ["/admin/:path*"],
};
