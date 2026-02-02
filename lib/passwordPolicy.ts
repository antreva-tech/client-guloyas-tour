/**
 * Password policy for admin, support, and supervisor accounts.
 * Enforces complexity and blocks common passwords.
 */

const PASSWORD_MIN_LENGTH = 8;

/** Common passwords to reject (lowercase comparison). */
const COMMON_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "admin",
  "letmein",
  "welcome",
  "qwerty123",
  "password1",
  "admin123",
]);

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a password against policy.
 * Requires: min 8 chars, at least one uppercase, one lowercase, one number.
 * Rejects common passwords.
 * @param password - Plain text password to validate.
 * @returns Validation result with valid flag and optional error message.
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: "La contraseña debe tener al menos 8 caracteres",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "La contraseña debe incluir al menos una mayúscula",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "La contraseña debe incluir al menos una minúscula",
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      error: "La contraseña debe incluir al menos un número",
    };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      valid: false,
      error: "Esa contraseña es demasiado común",
    };
  }

  return { valid: true };
}
