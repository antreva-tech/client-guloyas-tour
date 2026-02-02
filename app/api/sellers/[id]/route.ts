import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport, applyRateLimit } from "@/lib/apiAuth";

/**
 * DELETE /api/sellers/[id]
 * Removes a seller. Admin or support only.
 * Does not affect existing sales records.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  const { error: rateError } = await applyRateLimit("sellers:delete", "apiWrite");
  if (rateError) return rateError;

  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.seller.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
    }
    console.error("Error deleting seller:", error);
    return NextResponse.json(
      { error: "Error al eliminar vendedor" },
      { status: 500 }
    );
  }
}
