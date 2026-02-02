import { db } from "./db";

/** Day of week: 0 = Sunday, 1 = Monday, … 6 = Saturday (matches JS Date.getDay()). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_NAMES_ES: Record<DayOfWeek, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

/**
 * Returns the display name for a recurring weekly day.
 * @param day - 0=Sunday..6=Saturday
 */
export function getRecurringDayName(day: DayOfWeek): string {
  return DAY_NAMES_ES[day];
}

/**
 * Returns the next occurrence of the given weekday on or after the given date (UTC date parts).
 * @param dayOfWeek - 0=Sunday..6=Saturday
 * @param after - Date to search after (default: start of today UTC)
 * @returns Date at noon UTC on that weekday
 */
export function getNextOccurrence(dayOfWeek: DayOfWeek, after?: Date): Date {
  const ref = after ? new Date(after) : startOfTodayUTC();
  const refDay = ref.getUTCDay();
  let daysAhead = (dayOfWeek - refDay + 7) % 7;
  const next = new Date(ref);
  next.setUTCDate(ref.getUTCDate() + daysAhead);
  next.setUTCHours(12, 0, 0, 0);
  return next;
}

/** Start of today UTC (00:00:00.000). */
function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * For tours with recurringWeeklyDay set: if tourDate has passed (day is in the past),
 * resets sold to 0 and sets tourDate to the next occurrence of that weekday.
 * Idempotent: safe to run daily.
 * @returns Count of tours that were reset
 */
export async function runWeeklyRecurringReset(): Promise<number> {
  const now = startOfTodayUTC();
  const tours = await db.tour.findMany({
    where: { recurringWeeklyDay: { not: null } },
    select: { id: true, tourDate: true, recurringWeeklyDay: true, sold: true },
  });

  let resetCount = 0;
  for (const tour of tours) {
    const day = tour.recurringWeeklyDay as DayOfWeek;
    const tourDate = tour.tourDate;
    const tourDayStart = tourDate ? new Date(tourDate) : null;
    if (tourDayStart) tourDayStart.setUTCHours(0, 0, 0, 0);
    const hasPassed = !tourDayStart || tourDayStart.getTime() < now.getTime();
    if (!hasPassed) continue;

    const nextDate = getNextOccurrence(day, now);
    await db.tour.update({
      where: { id: tour.id },
      data: { sold: 0, tourDate: nextDate },
    });
    resetCount++;
  }
  return resetCount;
}
