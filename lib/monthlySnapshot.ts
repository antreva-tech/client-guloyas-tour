import { db } from "@/lib/db";

/**
 * Creates or updates the monthly summary snapshot for a given date.
 * @param now - Date to use for month/year calculation.
 */
export async function createMonthlySnapshot(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const products = await db.product.findMany({
    where: { isActive: true },
  });

  const totalRevenue = products.reduce((sum, p) => sum + p.price * p.sold, 0);
  const totalSold = products.reduce((sum, p) => sum + p.sold, 0);

  const topProduct = products.reduce(
    (top, p) => (p.sold > top.sold ? p : top),
    products[0] || { id: null, sold: 0 }
  );

  return db.monthlySummary.upsert({
    where: { year_month: { year, month } },
    update: {
      totalRevenue,
      totalSold,
      totalProducts: products.length,
      topProductId: topProduct?.id || null,
      topProductSold: topProduct?.sold || 0,
    },
    create: {
      year,
      month,
      totalRevenue,
      totalSold,
      totalProducts: products.length,
      topProductId: topProduct?.id || null,
      topProductSold: topProduct?.sold || 0,
    },
  });
}
