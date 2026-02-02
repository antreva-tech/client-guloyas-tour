import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

const SESSION_COOKIE_NAME = "retail_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours (reduced from 24 for security)
const SESSION_PAYLOAD_DELIMITER = "|"; // Used in extended payload to avoid conflicts with supervisor names
export type SessionRole = "admin" | "support" | "supervisor";

/**
 * Validates a redirect path to prevent open redirect attacks.
 * Only allows same-origin relative paths.
 * @param redirectTo - Raw redirect from query params.
 * @param fallback - Path to use when invalid (default "/admin").
 * @returns Safe relative path or fallback.
 */
export function getSafeRedirect(redirectTo: string | undefined, fallback = "/admin"): string {
  if (!redirectTo || typeof redirectTo !== "string") return fallback;
  const trimmed = redirectTo.trim();
  if (!trimmed) return fallback;
  // Reject absolute URLs and protocol-relative
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//")
  )
    return fallback;
  // Reject backslash (path traversal on Windows)
  if (trimmed.includes("\\")) return fallback;
  // Must be same-origin relative path
  if (!trimmed.startsWith("/")) return fallback;
  return trimmed;
}

/**
 * Retrieves the session secret from environment.
 * @returns The session secret string.
 * @throws Error if SESSION_SECRET is not configured.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * Creates an HMAC signature for session data.
 * @param data - The data to sign.
 * @returns The HMAC signature.
 */
function createSignature(data: string): string {
  return createHmac("sha256", getSessionSecret()).update(data).digest("hex");
}

const ADMIN_CREDENTIAL_ID = "admin";
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_HASH_PREFIX = "scrypt";
const PASSWORD_HASH_DELIMITER = "::";

/**
 * Returns the legacy bootstrap hash from environment, if configured.
 * @returns The legacy hash or null if missing.
 */
function getBootstrapPasswordHash(): string | null {
  return process.env.ADMIN_PASSWORD_HASH || null;
}

/**
 * Returns the support password hash from environment, if configured.
 * @returns The support hash or null if missing.
 */
function getSupportPasswordHash(): string | null {
  return process.env.SUPPORT_PASSWORD_HASH || null;
}

/** Parsed session data from cookie. */
export interface ParsedSession {
  payload: string;
  signature: string;
  role: SessionRole;
  supervisorName?: string;
  userId?: string;
  mustChangePassword?: boolean;
}

/**
 * Parses a session cookie value into its components.
 * Supports legacy (2-3 part) and extended (payload|signature) formats.
 * @param value - The raw cookie value.
 * @returns Parsed session payload and signature, or null if invalid.
 */
function parseSessionValue(value: string): ParsedSession | null {
  const dotParts = value.split(".");
  if (dotParts.length < 2) return null;

  const signature = dotParts.pop();
  if (!signature) return null;

  // Extended format: "timestamp|role|supervisorName|userId|mustChangePassword.signature"
  const payload = dotParts.join(".");
  if (payload.includes(SESSION_PAYLOAD_DELIMITER)) {
    const segs = payload.split(SESSION_PAYLOAD_DELIMITER);
    if (segs.length >= 2) {
      const [timestamp, role, supervisorName, userId, mustChangePasswordStr] = segs;
      if (!timestamp || !role) return null;
      if (role !== "admin" && role !== "support" && role !== "supervisor") return null;
      const mustChangePassword = mustChangePasswordStr === "1" || mustChangePasswordStr === "true";
      return {
        payload,
        signature,
        role: role as SessionRole,
        supervisorName: supervisorName || undefined,
        userId: userId || undefined,
        mustChangePassword: role === "supervisor" ? mustChangePassword : undefined,
      };
    }
  }

  // Legacy format: "timestamp.signature" or "timestamp.role.signature"
  if (dotParts.length === 1) {
    const [timestamp] = dotParts;
    if (!timestamp) return null;
    return { payload, signature, role: "admin" };
  }
  if (dotParts.length === 2) {
    const [timestamp, role] = dotParts;
    if (!timestamp || !role) return null;
    if (role !== "admin" && role !== "support") return null;
    return { payload, signature, role: role as SessionRole };
  }
  return null;
}

/**
 * Hashes a password using scrypt with a random salt.
 * @param password - Plain text password.
 * @returns Stored hash string in scrypt format (using :: delimiter).
 */
export function createPasswordHash(password: string): string {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString("hex");
  const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");
  return `${PASSWORD_HASH_PREFIX}${PASSWORD_HASH_DELIMITER}${salt}${PASSWORD_HASH_DELIMITER}${derived}`;
}

/**
 * Verifies a password against a stored hash (scrypt or legacy HMAC).
 * @param password - Plain text password.
 * @param storedHash - Stored hash value.
 * @returns True if password matches, false otherwise.
 */
function verifyPasswordHash(password: string, storedHash: string): boolean {
  const scryptPrefix = `${PASSWORD_HASH_PREFIX}${PASSWORD_HASH_DELIMITER}`;
  if (storedHash.startsWith(scryptPrefix)) {
    const [, salt, expectedHash] = storedHash.split(PASSWORD_HASH_DELIMITER);
    if (!salt || !expectedHash) return false;
    const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
    try {
      return timingSafeEqual(derived, Buffer.from(expectedHash, "hex"));
    } catch {
      return false;
    }
  }

  // Use environment variable for legacy HMAC secret
  const legacySecret = process.env.LEGACY_HMAC_SECRET;
  if (!legacySecret) {
    // Legacy authentication disabled if no secret configured
    return false;
  }

  const inputHash = createHmac("sha256", legacySecret)
    .update(password)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

/**
 * Checks whether a stored admin password exists in the database.
 * @returns True if a stored password exists, false otherwise.
 */
export async function hasStoredAdminPassword(): Promise<boolean> {
  const credential = await db.adminCredential.findUnique({
    where: { id: ADMIN_CREDENTIAL_ID },
    select: { id: true },
  });
  return Boolean(credential);
}

/**
 * Checks whether a bootstrap password hash exists in environment.
 * @returns True if legacy hash exists, false otherwise.
 */
export function hasBootstrapPassword(): boolean {
  return Boolean(getBootstrapPasswordHash());
}

/**
 * Verifies a bootstrap password against the legacy env hash.
 * @param password - Plain text password.
 * @returns True if password matches legacy hash, false otherwise.
 */
export function verifyBootstrapPassword(password: string): boolean {
  const storedHash = getBootstrapPasswordHash();
  if (!storedHash) {
    return false;
  }
  return verifyPasswordHash(password, storedHash);
}

/**
 * Creates the admin password if none exists.
 * @param password - Plain text password.
 * @returns True if created, false if already exists.
 */
export async function createAdminPassword(password: string): Promise<boolean> {
  const existing = await db.adminCredential.findUnique({
    where: { id: ADMIN_CREDENTIAL_ID },
    select: { id: true },
  });
  if (existing) {
    return false;
  }

  await db.adminCredential.create({
    data: {
      id: ADMIN_CREDENTIAL_ID,
      passwordHash: createPasswordHash(password),
    },
  });
  return true;
}

/**
 * Resets the admin password with a new hash.
 * @param password - Plain text password.
 */
export async function resetAdminPassword(password: string): Promise<void> {
  const passwordHash = createPasswordHash(password);
  await db.adminCredential.upsert({
    where: { id: ADMIN_CREDENTIAL_ID },
    update: { passwordHash },
    create: { id: ADMIN_CREDENTIAL_ID, passwordHash },
  });
}

/**
 * Verifies a supervisor user by username and password.
 * @param username - The username.
 * @param password - Plain text password.
 * @returns User data if valid and active, null otherwise.
 */
export async function verifyUserByUsername(
  username: string,
  password: string
): Promise<
  | { id: string; supervisorName: string | null; mustChangePassword: boolean }
  | null
> {
  const user = await db.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: { id: true, passwordHash: true, isActive: true, supervisorName: true, mustChangePassword: true },
  });
  if (!user || !user.isActive) return null;
  if (!verifyPasswordHash(password, user.passwordHash)) return null;
  return {
    id: user.id,
    supervisorName: user.supervisorName,
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Returns the role for a valid password (admin/support only, no username).
 * @param password - The password to verify.
 * @returns The role if password matches, otherwise null.
 */
export async function getPasswordRole(
  password: string
): Promise<SessionRole | null> {
  const credential = await db.adminCredential.findUnique({
    where: { id: ADMIN_CREDENTIAL_ID },
    select: { passwordHash: true },
  });
  const storedHash = credential?.passwordHash || getBootstrapPasswordHash();
  if (storedHash && verifyPasswordHash(password, storedHash)) {
    return "admin";
  }

  const supportHash = getSupportPasswordHash();
  if (supportHash && verifyPasswordHash(password, supportHash)) {
    return "support";
  }

  return null;
}

/**
 * Verifies the admin password against stored or support hash.
 * @param password - The password to verify.
 * @returns True if password matches, false otherwise.
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const role = await getPasswordRole(password);
  return Boolean(role);
}

/** Options for creating a supervisor session. */
export interface CreateSupervisorSessionOptions {
  role: "supervisor";
  userId: string;
  supervisorName: string | null;
  mustChangePassword: boolean;
}

/**
 * Creates a session by setting a signed cookie.
 * For admin/support use createSession(role). For supervisor use createSession with options.
 * Must be called from a Server Action or Route Handler.
 */
export async function createSession(
  roleOrOptions: SessionRole | CreateSupervisorSessionOptions = "admin"
): Promise<void> {
  const cookieStore = await cookies();
  const timestamp = Date.now().toString();

  let payload: string;
  if (typeof roleOrOptions === "object" && roleOrOptions.role === "supervisor") {
    const { userId, supervisorName, mustChangePassword } = roleOrOptions;
    payload = [
      timestamp,
      "supervisor",
      supervisorName ?? "",
      userId,
      mustChangePassword ? "1" : "0",
    ].join(SESSION_PAYLOAD_DELIMITER);
  } else {
    const role = typeof roleOrOptions === "string" ? roleOrOptions : "admin";
    payload = `${timestamp}.${role}`;
  }

  const signature = createSignature(payload);
  const sessionValue = `${payload}.${signature}`;

  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/** Session context returned to pages and middleware. */
export interface SessionContext {
  isValid: boolean;
  role: SessionRole | null;
  supervisorName?: string | null;
  userId?: string | null;
  mustChangePassword?: boolean;
}

/**
 * Retrieves the current session context from cookies.
 * @returns The session context containing role, validity, and optional supervisor fields.
 */
export async function getSessionContext(): Promise<SessionContext> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return { isValid: false, role: null };
    }

    const parsed = parseSessionValue(sessionCookie.value);
    if (!parsed) {
      return { isValid: false, role: null };
    }

    const expectedSignature = createSignature(parsed.payload);

    if (parsed.signature.length !== expectedSignature.length) {
      return { isValid: false, role: null };
    }

    const isValidSignature = timingSafeEqual(
      Buffer.from(parsed.signature),
      Buffer.from(expectedSignature)
    );
    if (!isValidSignature) {
      return { isValid: false, role: null };
    }

    const timestampStr = parsed.payload.includes(SESSION_PAYLOAD_DELIMITER)
      ? parsed.payload.split(SESSION_PAYLOAD_DELIMITER)[0]
      : parsed.payload.split(".")[0];
    const sessionTime = parseInt(timestampStr, 10);
    if (Number.isNaN(sessionTime)) {
      return { isValid: false, role: null };
    }

    const now = Date.now();
    const maxAge = SESSION_MAX_AGE * 1000;
    const isValid = now - sessionTime < maxAge;

    if (!isValid) {
      return { isValid: false, role: null };
    }

    return {
      isValid: true,
      role: parsed.role,
      supervisorName: parsed.supervisorName ?? null,
      userId: parsed.userId ?? null,
      mustChangePassword: parsed.mustChangePassword,
    };
  } catch {
    return { isValid: false, role: null };
  }
}

/**
 * Validates the current admin session.
 * @returns True if session is valid, false otherwise.
 */
export async function validateSession(): Promise<boolean> {
  const context = await getSessionContext();
  return context.isValid;
}

/**
 * Destroys the current admin session.
 * Must be called from a Server Action or Route Handler.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
