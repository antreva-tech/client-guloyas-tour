import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiSessionContext, requireSupervisorOrAbove } from "@/lib/apiAuth";

/**
 * GET /api/sales/stats
 * Returns revenue and units from fully paid, non-voided invoices only.
 * Admin/Support only; supervisor gets 403 (no Resumen access).
 */
export async function GET() {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  const session = await getApiSessionContext();
  if (session.role === "supervisor") {
    return NextResponse.json(
      { error: "No autorizado para ver resumen" },
      { status: 403 }
    );
  }

  try {
    const [paid, sales, provinciaSales] = await Promise.all([
      db.sale.aggregate({
        where: { isPaid: true, voidedAt: null },
        _sum: { total: true, quantity: true },
      }),
      db.sale.findMany({
        where: {
          voidedAt: null,
          nombreVendedor: { not: null },
        },
        select: { nombreVendedor: true, batchId: true, total: true },
      }),
      db.sale.findMany({
        where: { voidedAt: null, provincia: { not: null } },
        select: { provincia: true, total: true },
      }),
    ]);

    const bySeller = new Map<
      string,
      { revenue: number; batchIds: Set<string> }
    >();
    for (const s of sales) {
      const name = (s.nombreVendedor || "").trim();
      if (!name) continue;
      let entry = bySeller.get(name);
      if (!entry) {
        entry = { revenue: 0, batchIds: new Set<string>() };
        bySeller.set(name, entry);
      }
      entry.revenue += s.total;
      entry.batchIds.add(s.batchId);
    }

    const topSellers = Array.from(bySeller.entries())
      .map(([nombreVendedor, data]) => ({
        nombreVendedor,
        totalRevenue: data.revenue,
        invoiceCount: data.batchIds.size,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const byProvincia = new Map<string, number>();
    for (const s of provinciaSales) {
      const prov = (s.provincia || "").trim();
      if (!prov) continue;
      byProvincia.set(prov, (byProvincia.get(prov) ?? 0) + s.total);
    }
    const provinciaStats = Array.from(byProvincia.entries())
      .map(([provincia, total]) => ({ provincia, total }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      paidRevenue: paid._sum.total ?? 0,
      paidUnits: paid._sum.quantity ?? 0,
      topSellers,
      provinciaStats,
    });
  } catch (error) {
    console.error("Sales stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales stats" },
      { status: 500 }
    );
  }
}
