import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  createRateLimitId,
  RATE_LIMITS,
  type RateLimitResult,
} from "@/lib/rateLimit";
import type { SessionRole } from "@/lib/auth";

const SESSION_COOKIE_NAME = "retail_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours (match auth.ts)
const SESSION_PAYLOAD_DELIMITER = "|";

/**
 * Retrieves the session secret from environment.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set");
  return secret;
}

/**
 * Creates an HMAC signature for session data.
 */
function createSignature(data: string): string {
  return createHmac("sha256", getSessionSecret()).update(data).digest("hex");
}

/**
 * Parses session cookie (supports legacy and extended formats).
 */
function parseSessionValue(value: string): {
  payload: string;
  signature: string;
  role: SessionRole;
  supervisorName?: string;
  userId?: string;
} | null {
  const dotParts = value.split(".");
  if (dotParts.length < 2) return null;
  const signature = dotParts.pop();
  if (!signature) return null;
  const payload = dotParts.join(".");

  if (payload.includes(SESSION_PAYLOAD_DELIMITER)) {
    const segs = payload.split(SESSION_PAYLOAD_DELIMITER);
    if (segs.length >= 2) {
      const [timestamp, role, supervisorName, userId] = segs;
      if (!timestamp || !role) return null;
      if (role !== "admin" && role !== "support" && role !== "supervisor") return null;
      return {
        payload,
        signature,
        role: role as SessionRole,
        supervisorName: supervisorName || undefined,
        userId: userId || undefined,
      };
    }
  }

  if (dotParts.length === 1) return { payload, signature, role: "admin" };
  if (dotParts.length === 2) {
    const [ts, role] = dotParts;
    if (!ts || !role || (role !== "admin" && role !== "support")) return null;
    return { payload, signature, role: role as SessionRole };
  }
  return null;
}

/**
 * Result of API authentication check.
 */
export interface ApiAuthResult {
  isValid: boolean;
  role: SessionRole | null;
  supervisorName?: string | null;
  userId?: string | null;
}

/**
 * Validates the session from cookies for API routes.
 */
export async function getApiSessionContext(): Promise<ApiAuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return { isValid: false, role: null };

    const parsed = parseSessionValue(sessionCookie.value);
    if (!parsed) return { isValid: false, role: null };

    const expectedSignature = createSignature(parsed.payload);
    if (parsed.signature.length !== expectedSignature.length) return { isValid: false, role: null };

    const isValidSignature = timingSafeEqual(
      Buffer.from(parsed.signature),
      Buffer.from(expectedSignature)
    );
    if (!isValidSignature) return { isValid: false, role: null };

    const timestampStr = parsed.payload.includes(SESSION_PAYLOAD_DELIMITER)
      ? parsed.payload.split(SESSION_PAYLOAD_DELIMITER)[0]
      : parsed.payload.split(".")[0];
    const sessionTime = parseInt(timestampStr, 10);
    if (Number.isNaN(sessionTime)) return { isValid: false, role: null };

    const now = Date.now();
    if (now - sessionTime >= SESSION_MAX_AGE * 1000) return { isValid: false, role: null };

    return {
      isValid: true,
      role: parsed.role,
      supervisorName: parsed.supervisorName ?? null,
      userId: parsed.userId ?? null,
    };
  } catch {
    return { isValid: false, role: null };
  }
}

/**
 * Requires authentication for API routes.
 * Returns a 401 response if not authenticated or not in allowed roles.
 * @param allowedRoles - Array of roles that can access this route.
 * @returns NextResponse with 401 error if unauthorized, null if authorized.
 */
export async function requireAuth(
  allowedRoles: SessionRole[] = ["admin"]
): Promise<NextResponse | null> {
  const session = await getApiSessionContext();

  if (!session.isValid) {
    return NextResponse.json(
      { error: "Unauthorized - Please log in" },
      { status: 401 }
    );
  }

  if (!session.role || !allowedRoles.includes(session.role)) {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 }
    );
  }

  return null; // Authorized
}

/**
 * Requires admin role specifically.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  return requireAuth(["admin"]);
}

/**
 * Requires admin or support role (products, settings, export/import).
 */
export async function requireAdminOrSupport(): Promise<NextResponse | null> {
  return requireAuth(["admin", "support"]);
}

/**
 * Requires supervisor, admin, or support (sales/invoices).
 */
export async function requireSupervisorOrAbove(): Promise<NextResponse | null> {
  return requireAuth(["supervisor", "admin", "support"]);
}

/**
 * Applies rate limiting to an API request.
 * @param endpoint - The endpoint identifier for rate limiting.
 * @param type - The type of rate limit to apply.
 * @returns NextResponse with 429 error if rate limited, null if allowed.
 */
export async function applyRateLimit(
  endpoint: string,
  type: keyof typeof RATE_LIMITS = "apiWrite"
): Promise<{ error: NextResponse | null; result: RateLimitResult }> {
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const rateLimitId = createRateLimitId(clientIp, endpoint);
  const result = await checkRateLimit(rateLimitId, RATE_LIMITS[type]);

  if (!result.allowed) {
    const error = NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: Math.ceil(result.resetIn / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.resetIn / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(Math.max(0, result.limit - result.current)),
          "X-RateLimit-Reset": String(Math.ceil(result.resetIn / 1000)),
        },
      }
    );
    return { error, result };
  }

  return { error: null, result };
}
