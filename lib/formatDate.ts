/**
 * Date formatting utilities for consistent DD/MM/YYYY display across the app.
 * Uses UTC for date-only values to avoid off-by-one-day in western timezones.
 */

/**
 * Formats a date as DD/MM/YYYY.
 * Uses UTC when parsing ISO date strings to avoid timezone shift (e.g. "2025-01-15" stays Jan 15).
 * @param date - Date object or ISO string.
 * @returns Formatted date string (e.g. "31/01/2025") or empty string if invalid.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (date == null) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [y, m, day] = date.slice(0, 10).split("-");
    if (y && m && day) return `${day}/${m}/${y}`;
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date with time as DD/MM/YYYY HH:mm.
 * Date part uses UTC to avoid off-by-one-day for date-only values; time uses local timezone.
 * @param date - Date object or ISO string.
 * @returns Formatted datetime string (e.g. "31/01/2025 14:30") or empty string if invalid.
 */
/**
 * Parses DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD. Returns empty string if invalid.
 */
export function parseDdMmYyyyToYyyyMmDd(input: string): string {
  const s = (input || "").trim();
  const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  const d = parseInt(day!, 10);
  const m = parseInt(month!, 10);
  const y = parseInt(year!, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Returns today's date as DD/MM/YYYY (for placeholders and min-date display).
 */
export function todayDdMmYyyy(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (date == null) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${dateStr} ${hours}:${minutes}`;
}
