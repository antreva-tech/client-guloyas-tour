import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport, requireSupervisorOrAbove, applyRateLimit } from "@/lib/apiAuth";
import { z } from "zod";

const CreateSellerSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200).transform((s) => s.trim()),
});

/**
 * GET /api/sellers
 * Returns list of sellers from the database. Empty list is valid (no auto-seed).
 * Requires supervisor or above (for sale form).
 */
export async function GET() {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  try {
    const sellers = await db.seller.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json(
      { error: "Error al cargar vendedores" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sellers
 * Creates a new seller. Admin or support only.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  const { error: rateError } = await applyRateLimit("sellers:create", "apiWrite");
  if (rateError) return rateError;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CreateSellerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name } = parsed.data;

    const existing = await db.seller.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ese vendedor ya existe" },
        { status: 400 }
      );
    }

    const created = await db.seller.create({ data: { name } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating seller:", error);
    return NextResponse.json(
      { error: "Error al crear vendedor" },
      { status: 500 }
    );
  }
}
