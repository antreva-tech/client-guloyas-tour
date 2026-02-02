import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport } from "@/lib/apiAuth";

/**
 * Returns true if value looks like "creado por" / creator info rather than a real seller name.
 */
function isCreadoporValue(val: string): boolean {
  const s = (val || "").trim();
  if (!s) return true;
  if (s.includes("@")) return true;
  return /^creado\s*por$/i.test(s);
}

/**
 * GET /api/sellers/names-from-sales
 * Returns distinct nombreVendedor values from Sale table with counts.
 * Admin or support only. Used for seller merge tool.
 */
export async function GET() {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const sales = await db.sale.findMany({
      where: { nombreVendedor: { not: null } },
      select: { nombreVendedor: true },
    });

    const countByName = new Map<string, number>();
    for (const s of sales) {
      const name = (s.nombreVendedor || "").trim();
      if (!name || isCreadoporValue(name)) continue;
      countByName.set(name, (countByName.get(name) || 0) + 1);
    }

    const names = Array.from(countByName.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    return NextResponse.json({ names });
  } catch (error) {
    console.error("Error fetching seller names from sales:", error);
    return NextResponse.json(
      { error: "Error al cargar nombres de ventas" },
      { status: 500 }
    );
  }
}
