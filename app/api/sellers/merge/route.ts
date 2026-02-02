import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport, applyRateLimit } from "@/lib/apiAuth";
import { z } from "zod";

const MergeSchema = z.object({
  fromName: z.string().min(1).transform((s) => s.trim()),
  toName: z.string().min(1).transform((s) => s.trim()),
});

/**
 * POST /api/sellers/merge
 * Updates all Sale records: nombreVendedor from 'fromName' to 'toName'.
 * Optionally adds toName to Seller table if not present.
 * Admin or support only.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  const { error: rateError } = await applyRateLimit("sellers:merge", "apiWrite");
  if (rateError) return rateError;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = MergeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "fromName y toName son requeridos" },
        { status: 400 }
      );
    }

    const { fromName, toName } = parsed.data;
    if (fromName === toName) {
      return NextResponse.json(
        { error: "fromName y toName deben ser diferentes" },
        { status: 400 }
      );
    }

    const result = await db.sale.updateMany({
      where: { nombreVendedor: fromName },
      data: { nombreVendedor: toName },
    });

    // Add toName to Seller table if not present (for sale form dropdown)
    const existing = await db.seller.findFirst({
      where: { name: { equals: toName, mode: "insensitive" } },
    });
    if (!existing) {
      await db.seller.create({ data: { name: toName } });
    }

    return NextResponse.json({
      updated: result.count,
      message: `Unificados ${result.count} registros de venta: "${fromName}" → "${toName}"`,
    });
  } catch (error) {
    console.error("Error merging sellers:", error);
    return NextResponse.json(
      { error: "Error al unificar vendedores" },
      { status: 500 }
    );
  }
}
