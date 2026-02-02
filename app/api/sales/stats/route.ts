import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiSessionContext, requireSupervisorOrAbove } from "@/lib/apiAuth";

/** Top tour by revenue and seats sold. */
export interface TopTourStat {
  tourId: string;
  tourName: string;
  revenue: number;
  seatsSold: number;
}

/**
 * GET /api/sales/stats
 * Returns revenue, units, and KPIs from sales/tours.
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
    const [
      paid,
      unpaidAbono,
      sales,
      provinciaSales,
      pendingAgg,
      voidedBatches,
      validBatches,
      paidBatches,
      tourCapacity,
      salesByTour,
    ] = await Promise.all([
      db.sale.aggregate({
        where: { isPaid: true, voidedAt: null },
        _sum: { total: true, quantity: true },
      }),
      db.sale.aggregate({
        where: { isPaid: false, voidedAt: null },
        _sum: { abono: true },
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
      db.sale.aggregate({
        where: {
          voidedAt: null,
          isPaid: false,
          pendiente: { not: null },
        },
        _sum: { pendiente: true },
      }),
      db.sale.findMany({
        where: { voidedAt: { not: null } },
        select: { batchId: true },
        distinct: ["batchId"],
      }),
      db.sale.findMany({
        where: { voidedAt: null },
        select: { batchId: true },
        distinct: ["batchId"],
      }),
      db.sale.findMany({
        where: { isPaid: true, voidedAt: null },
        select: { batchId: true },
        distinct: ["batchId"],
      }),
      db.tour.aggregate({
        where: { isActive: true },
        _sum: { stock: true, sold: true },
      }),
      db.sale.groupBy({
        by: ["tourId"],
        where: { voidedAt: null },
        _sum: { total: true, quantity: true },
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

    const pendingRevenue = pendingAgg._sum.pendiente ?? 0;
    const voidedInvoiceCount = voidedBatches.length;
    const validInvoiceCount = validBatches.length;
    const paidInvoiceCount = paidBatches.length;
    const totalInvoices = voidedInvoiceCount + validInvoiceCount;
    const voidRate =
      totalInvoices > 0 ? (voidedInvoiceCount / totalInvoices) * 100 : 0;

    const totalCapacity = tourCapacity._sum.stock ?? 0;
    const totalSold = tourCapacity._sum.sold ?? 0;
    const occupancyPercent =
      totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : undefined;

    const tourIds = salesByTour.map((g) => g.tourId);
    const tours =
      tourIds.length > 0
        ? await db.tour.findMany({
            where: { id: { in: tourIds } },
            select: { id: true, name: true },
          })
        : [];
    const tourNameMap = new Map(tours.map((t) => [t.id, t.name]));

    const topTours: TopTourStat[] = salesByTour
      .map((g) => ({
        tourId: g.tourId,
        tourName: tourNameMap.get(g.tourId) ?? "—",
        revenue: g._sum.total ?? 0,
        seatsSold: g._sum.quantity ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    /** Ingresos cobrados = full total for paid invoices + abono (deposit) for unpaid. */
    const paidRevenue =
      (paid._sum.total ?? 0) + (unpaidAbono._sum.abono ?? 0);

    return NextResponse.json({
      paidRevenue,
      paidUnits: paid._sum.quantity ?? 0,
      topSellers,
      provinciaStats,
      pendingRevenue,
      voidedInvoiceCount,
      paidInvoiceCount,
      occupancyPercent: occupancyPercent ?? null,
      topTours,
      voidRate,
    });
  } catch (error) {
    console.error("Sales stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales stats" },
      { status: 500 }
    );
  }
}
