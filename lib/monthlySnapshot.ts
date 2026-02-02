import { db } from "@/lib/db";

/**
 * Creates or updates the monthly summary snapshot for a given date.
 * @param now - Date to use for month/year calculation.
 */
export async function createMonthlySnapshot(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const tours = await db.tour.findMany({
    where: { isActive: true },
  });

  const totalRevenue = tours.reduce((sum, p) => sum + p.price * p.sold, 0);
  const totalSold = tours.reduce((sum, p) => sum + p.sold, 0);

  const topTour = tours.reduce(
    (top, p) => (p.sold > top.sold ? p : top),
    tours[0] || { id: null, sold: 0 }
  );

  return db.monthlySummary.upsert({
    where: { year_month: { year, month } },
    update: {
      totalRevenue,
      totalSold,
      totalTours: tours.length,
      topTourId: topTour?.id || null,
      topTourSold: topTour?.sold || 0,
    },
    create: {
      year,
      month,
      totalRevenue,
      totalSold,
      totalTours: tours.length,
      topTourId: topTour?.id || null,
      topTourSold: topTour?.sold || 0,
    },
  });
}
