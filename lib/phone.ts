/**
 * Phone number utilities for links (WhatsApp wa.me, tel:).
 */

/** Dominican Republic area codes (10-digit local format). */
const DR_AREA_CODES = ["809", "829", "849"];

/**
 * Strips non-digit characters from a phone string.
 * @param phone - Raw phone string.
 * @returns Digits only.
 */
function toDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Formats a phone number for WhatsApp wa.me links.
 * Adds Dominican Republic country code (1) when missing.
 * @param phone - Raw phone string (e.g. "829-555-1234", "8295551234").
 * @returns E.164-style number for wa.me (e.g. "18295551234").
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = toDigits(phone);
  if (digits.length === 0) return "";
  // Already has country code (11+ digits, starts with 1)
  if (digits.length >= 11 && digits.startsWith("1")) return digits;
  // Dominican Republic 10-digit: 809/829/849 + 7 digits
  if (digits.length === 10 && DR_AREA_CODES.includes(digits.slice(0, 3))) {
    return "1" + digits;
  }
  return digits;
}

/**
 * Formats a phone number for tel: links (removes spaces, dashes).
 * Preserves local format for tel: as devices handle dialing.
 * @param phone - Raw phone string.
 * @returns Cleaned digits for tel: URL.
 */
export function formatPhoneForTel(phone: string): string {
  return toDigits(phone);
}
