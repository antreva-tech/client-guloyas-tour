/**
 * Rate limiter: Upstash Redis in production, in-memory fallback when env vars unset.
 * Upstash persists across serverless instances; in-memory does not.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiter configuration.
 */
interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/** Upstash limiters keyed by "maxRequests-windowMs" for reuse. */
const upstashLimiters = new Map<string, Ratelimit>();

/**
 * Gets or creates an Upstash Ratelimit instance for the given config.
 * Returns null if UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN are not set.
 */
function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const key = `${config.maxRequests}-${config.windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    const redis = new Redis({ url, token });
    const windowSec = Math.ceil(config.windowMs / 1000);
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(config.maxRequests, `${windowSec} s`),
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

/**
 * Default rate limit configurations for different endpoints.
 */
export const RATE_LIMITS = {
  /** Login attempts: 5 per minute */
  login: { maxRequests: 5, windowMs: 60 * 1000 },
  /** Password setup/reset: 5 per minute */
  passwordChange: { maxRequests: 5, windowMs: 60 * 1000 },
  /** API writes: 30 per minute */
  apiWrite: { maxRequests: 30, windowMs: 60 * 1000 },
  /** API reads: 100 per minute */
  apiRead: { maxRequests: 100, windowMs: 60 * 1000 },
  /** File uploads: 10 per minute */
  upload: { maxRequests: 10, windowMs: 60 * 1000 },
} as const;

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count in the window */
  current: number;
  /** Maximum requests allowed */
  limit: number;
  /** Milliseconds until the window resets */
  resetIn: number;
}

/**
 * Checks if a request is rate limited.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * @param identifier - Unique identifier for the rate limit (e.g., IP + endpoint).
 * @param config - Rate limit configuration.
 * @returns Rate limit result with allowed status and metadata.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const upstashLimiter = getUpstashLimiter(config);
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(identifier);
    const resetIn = Math.max(0, result.reset - Date.now());
    return {
      allowed: result.success,
      current: result.limit - result.remaining,
      limit: result.limit,
      resetIn,
    };
  }

  // In-memory fallback (does not persist across serverless instances)
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      current: 1,
      limit: config.maxRequests,
      resetIn: config.windowMs,
    };
  }

  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  const resetIn = Math.max(0, entry.resetTime - now);

  return {
    allowed,
    current: entry.count,
    limit: config.maxRequests,
    resetIn,
  };
}

/**
 * Extracts client IP from request headers.
 * Prefers Vercel's header (platform-set, not spoofable) when on Vercel.
 * @param headers - Request headers.
 * @returns Client IP address or "unknown".
 */
export function getClientIp(headers: Headers): string {
  // Vercel overwrites this with the true client IP (not spoofable)
  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }

  // Fallback for other hosting (trusted proxy must overwrite these)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Creates a rate limit identifier from IP and endpoint.
 * @param ip - Client IP address.
 * @param endpoint - API endpoint path.
 * @returns Combined identifier string.
 */
export function createRateLimitId(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}
