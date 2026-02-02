-- Add recurring weekly day for tours (0=Sunday..6=Saturday). When set, seats reset weekly after that day.
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "recurringWeeklyDay" INTEGER;
